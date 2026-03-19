import Map "mo:core/Map";
import Array "mo:core/Array";
import Iter "mo:core/Iter";
import Text "mo:core/Text";
import Time "mo:core/Time";
import Principal "mo:core/Principal";
import VarArray "mo:core/VarArray";
import Runtime "mo:core/Runtime";
import Order "mo:core/Order";
import Nat "mo:core/Nat";
import AccessControl "authorization/access-control";
import Stripe "stripe/stripe";
import OutCall "http-outcalls/outcall";
import Storage "blob-storage/Storage";
import MixinStorage "blob-storage/Mixin";
import MixinAuthorization "authorization/MixinAuthorization";

actor {
  include MixinStorage();

  let accessControlState = (AccessControl.initState() : AccessControl.AccessControlState);
  include MixinAuthorization(accessControlState);

  let userProfiles = Map.empty<Principal, UserProfile>();
  let deletedProfiles = Map.empty<Principal, UserProfile>();
  let restrictedCreators = Map.empty<Principal, Bool>();

  // Separate maps for new fields — avoids stable variable compatibility issues
  let userProfilePictures = Map.empty<Principal, Storage.ExternalBlob>();
  let bookFiles = Map.empty<Text, Storage.ExternalBlob>();

  // Track who the first admin is (the one who claimed admin via the banner)
  var firstAdmin : ?Principal = null;

  public type UserProfile = {
    name : Text;
    role : Text;
    phone : ?Text;
    email : ?Text;
  };

  public type Book = {
    id : Text;
    title : Text;
    description : Text;
    author : Principal;
    coverImageId : Storage.ExternalBlob;
    priceCents : Nat;
    genre : Text;
    publishedAt : ?Int;
    isPublished : Bool;
    offlineLocation : ?Text;
  };

  public type ShortFilm = {
    id : Text;
    title : Text;
    description : Text;
    director : Principal;
    videoId : Storage.ExternalBlob;
    thumbnailId : Storage.ExternalBlob;
    duration : Nat;
    genre : Text;
    publishedAt : ?Int;
    isPublished : Bool;
  };

  public type PurchaseRecord = {
    id : Text;
    bookId : Text;
    buyerPrincipal : Principal;
    creatorPrincipal : Principal;
    totalAmountCents : Nat;
    creatorShareCents : Nat;
    adminShareCents : Nat;
    stripePaymentIntentId : Text;
    purchasedAt : Int;
  };

  // Full user profile including picture (returned to frontend)
  public type UserProfileFull = {
    name : Text;
    role : Text;
    phone : ?Text;
    email : ?Text;
    profilePictureId : ?Storage.ExternalBlob;
  };

  // Full book including file (returned to frontend)
  public type BookFull = {
    id : Text;
    title : Text;
    description : Text;
    author : Principal;
    coverImageId : Storage.ExternalBlob;
    fileId : ?Storage.ExternalBlob;
    priceCents : Nat;
    genre : Text;
    publishedAt : ?Int;
    isPublished : Bool;
    offlineLocation : ?Text;
  };

  let bookOfflinePrices = Map.empty<Text, Nat>();
  let books = Map.empty<Text, Book>();
  let shortFilms = Map.empty<Text, ShortFilm>();
  let purchases = Map.empty<Text, PurchaseRecord>();

  var stripeConfiguration : ?Stripe.StripeConfiguration = null;

  // Helper: enrich Book with fileId
  func enrichBook(book : Book) : BookFull {
    {
      id = book.id;
      title = book.title;
      description = book.description;
      author = book.author;
      coverImageId = book.coverImageId;
      fileId = bookFiles.get(book.id);
      priceCents = book.priceCents;
      genre = book.genre;
      publishedAt = book.publishedAt;
      isPublished = book.isPublished;
      offlineLocation = book.offlineLocation;
    };
  };

  // Helper: enrich UserProfile with picture
  func enrichProfile(principal : Principal, profile : UserProfile) : UserProfileFull {
    {
      name = profile.name;
      role = profile.role;
      phone = profile.phone;
      email = profile.email;
      profilePictureId = userProfilePictures.get(principal);
    };
  };

  public shared query ({ caller }) func isStripeConfigured() : async Bool {
    stripeConfiguration != null;
  };

  public shared ({ caller }) func setStripeConfiguration(config : Stripe.StripeConfiguration) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    stripeConfiguration := ?config;
  };

  func getStripeConfiguration() : Stripe.StripeConfiguration {
    switch (stripeConfiguration) {
      case (null) { Runtime.trap("stripe needs to be first configured") };
      case (?value) { value };
    };
  };

  public shared query ({ caller }) func transform(input : OutCall.TransformationInput) : async OutCall.TransformationOutput {
    OutCall.transform(input);
  };

  public func getStripeSessionStatus(sessionId : Text) : async Stripe.StripeSessionStatus {
    await Stripe.getSessionStatus(getStripeConfiguration(), sessionId, transform);
  };

  public shared ({ caller }) func createCheckoutSession(items : [Stripe.ShoppingItem], successUrl : Text, cancelUrl : Text) : async Text {
    await Stripe.createCheckoutSession(getStripeConfiguration(), caller, items, successUrl, cancelUrl, transform);
  };

  public shared ({ caller }) func claimFirstAdmin() : async Bool {
    if (caller.isAnonymous()) { return false };
    if (hasAdminBeenAssignedHelper()) { return false };
    accessControlState.userRoles.add(caller, #admin);
    accessControlState.adminAssigned := true;
    firstAdmin := ?caller;
    true;
  };

  func hasAdminBeenAssignedHelper() : Bool {
    for ((_, role) in accessControlState.userRoles.entries()) {
      if (role == #admin) { return true };
    };
    false;
  };

  public shared query ({ caller }) func hasAdminBeenAssigned() : async Bool {
    hasAdminBeenAssignedHelper();
  };

  // Returns the Principal of the first admin (the one who claimed admin)
  public shared query ({ caller }) func getFirstAdmin() : async ?Principal {
    firstAdmin;
  };

  // Only the first admin can remove another admin
  public shared ({ caller }) func removeAdmin(user : Principal) : async () {
    switch (firstAdmin) {
      case (null) { Runtime.trap("No first admin set") };
      case (?fa) {
        if (caller != fa) {
          Runtime.trap("Unauthorized: Only the first admin can remove other admins");
        };
        if (user == fa) {
          Runtime.trap("Cannot remove yourself as admin");
        };
        accessControlState.userRoles.remove(user);
      };
    };
  };

  public shared query ({ caller }) func getCallerUserProfile() : async ?UserProfileFull {
    if (caller.isAnonymous()) {
      Runtime.trap("Unauthorized: Must be signed in to view profile");
    };
    switch (userProfiles.get(caller)) {
      case (null) { null };
      case (?profile) { ?enrichProfile(caller, profile) };
    };
  };

  public shared query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfileFull {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    switch (userProfiles.get(user)) {
      case (null) { null };
      case (?profile) { ?enrichProfile(user, profile) };
    };
  };

  public shared query ({ caller }) func getAllUserProfiles() : async [{ principal : Principal; name : Text; role : Text }] {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can view all profiles");
    };
    userProfiles.entries().toArray().map(func((p, profile)) { { principal = p; name = profile.name; role = profile.role } });
  };

  public shared query ({ caller }) func getCreatorProfiles() : async [{ principal : Principal; name : Text; role : Text; phone : ?Text; email : ?Text; profilePictureId : ?Storage.ExternalBlob }] {
    let filtered = userProfiles.entries().toArray().filter(
      func((_, profile)) { profile.role == "creator" }
    );
    filtered.map(
      func((principal, profile)) {
        { principal; name = profile.name; role = profile.role; phone = profile.phone; email = profile.email; profilePictureId = userProfilePictures.get(principal) };
      }
    );
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfileFull) : async () {
    if (caller.isAnonymous()) {
      Runtime.trap("Unauthorized: Must be signed in to save a profile");
    };
    // Store base profile (without picture)
    userProfiles.add(caller, {
      name = profile.name;
      role = profile.role;
      phone = profile.phone;
      email = profile.email;
    });
    // Store picture separately
    switch (profile.profilePictureId) {
      case (null) { };
      case (?pic) { userProfilePictures.add(caller, pic) };
    };
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      accessControlState.userRoles.add(caller, #user);
    };
  };

  // Admin: delete a user profile (moves to deleted store for potential restoration)
  public shared ({ caller }) func deleteUserProfile(user : Principal) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can delete profiles");
    };
    switch (userProfiles.get(user)) {
      case (null) { Runtime.trap("Profile not found") };
      case (?profile) {
        deletedProfiles.add(user, profile);
        userProfiles.remove(user);
      };
    };
  };

  // Admin: restore a deleted profile
  public shared ({ caller }) func restoreUserProfile(user : Principal) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can restore profiles");
    };
    switch (deletedProfiles.get(user)) {
      case (null) { Runtime.trap("Deleted profile not found") };
      case (?profile) {
        userProfiles.add(user, profile);
        deletedProfiles.remove(user);
      };
    };
  };

  // Admin: get all deleted profiles
  public shared query ({ caller }) func getDeletedProfiles() : async [{ principal : Principal; name : Text; role : Text }] {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can view deleted profiles");
    };
    deletedProfiles.entries().toArray().map(func((p, profile)) { { principal = p; name = profile.name; role = profile.role } });
  };

  // Admin: restrict a creator from publishing
  public shared ({ caller }) func restrictCreatorFromPublishing(user : Principal) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can restrict creators");
    };
    restrictedCreators.add(user, true);
  };

  // Admin: lift restriction from a creator
  public shared ({ caller }) func unrestrictCreatorFromPublishing(user : Principal) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can unrestrict creators");
    };
    restrictedCreators.remove(user);
  };

  // Admin: get all restricted creators
  public shared query ({ caller }) func getRestrictedCreators() : async [Principal] {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can view restricted creators");
    };
    restrictedCreators.keys().toArray();
  };

  // Book Management
  public shared ({ caller }) func submitBook(book : BookFull) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only creators can submit books");
    };
    if (restrictedCreators.get(caller) == ?true) {
      Runtime.trap("Your account has been restricted from publishing by an admin");
    };
    if (book.author != caller) {
      Runtime.trap("Unauthorized: You can only submit books as yourself");
    };
    books.add(book.id, {
      id = book.id; title = book.title; description = book.description;
      author = book.author; coverImageId = book.coverImageId;
      priceCents = book.priceCents; genre = book.genre;
      publishedAt = book.publishedAt; isPublished = book.isPublished;
      offlineLocation = book.offlineLocation;
    });
    switch (book.fileId) {
      case (null) { };
      case (?f) { bookFiles.add(book.id, f) };
    };
  };

  public shared ({ caller }) func submitBookWithPricing(book : BookFull, offlinePriceCents : ?Nat) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only creators can submit books");
    };
    if (restrictedCreators.get(caller) == ?true) {
      Runtime.trap("Your account has been restricted from publishing by an admin");
    };
    if (book.author != caller) {
      Runtime.trap("Unauthorized: You can only submit books as yourself");
    };
    books.add(book.id, {
      id = book.id; title = book.title; description = book.description;
      author = book.author; coverImageId = book.coverImageId;
      priceCents = book.priceCents; genre = book.genre;
      publishedAt = book.publishedAt; isPublished = book.isPublished;
      offlineLocation = book.offlineLocation;
    });
    switch (book.fileId) {
      case (null) { };
      case (?f) { bookFiles.add(book.id, f) };
    };
    switch (offlinePriceCents) {
      case (null) { bookOfflinePrices.remove(book.id) };
      case (?price) { bookOfflinePrices.add(book.id, price) };
    };
  };

  public shared ({ caller }) func setBookOfflinePrice(bookId : Text, offlinePriceCents : ?Nat) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized");
    };
    switch (books.get(bookId)) {
      case (null) { Runtime.trap("Book not found") };
      case (?book) {
        if (book.author != caller and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: You can only edit your own books");
        };
        switch (offlinePriceCents) {
          case (null) { bookOfflinePrices.remove(bookId) };
          case (?price) { bookOfflinePrices.add(bookId, price) };
        };
      };
    };
  };

  public shared query ({ caller }) func getBookOfflinePrice(bookId : Text) : async ?Nat {
    bookOfflinePrices.get(bookId);
  };

  public shared ({ caller }) func editBook(id : Text, book : BookFull) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only creators can edit books");
    };
    switch (books.get(id)) {
      case (null) { Runtime.trap("Book not found") };
      case (?existingBook) {
        if (existingBook.author != caller and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: You can only edit your own books");
        };
        if (book.author != existingBook.author) {
          Runtime.trap("Cannot change book author");
        };
        books.add(id, {
          id = book.id; title = book.title; description = book.description;
          author = book.author; coverImageId = book.coverImageId;
          priceCents = book.priceCents; genre = book.genre;
          publishedAt = book.publishedAt; isPublished = book.isPublished;
          offlineLocation = book.offlineLocation;
        });
        switch (book.fileId) {
          case (null) { };
          case (?f) { bookFiles.add(id, f) };
        };
      };
    };
  };

  public shared ({ caller }) func editBookWithPricing(id : Text, book : BookFull, offlinePriceCents : ?Nat) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only creators can edit books");
    };
    switch (books.get(id)) {
      case (null) { Runtime.trap("Book not found") };
      case (?existingBook) {
        if (existingBook.author != caller and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: You can only edit your own books");
        };
        if (book.author != existingBook.author) {
          Runtime.trap("Cannot change book author");
        };
        books.add(id, {
          id = book.id; title = book.title; description = book.description;
          author = book.author; coverImageId = book.coverImageId;
          priceCents = book.priceCents; genre = book.genre;
          publishedAt = book.publishedAt; isPublished = book.isPublished;
          offlineLocation = book.offlineLocation;
        });
        switch (book.fileId) {
          case (null) { };
          case (?f) { bookFiles.add(id, f) };
        };
        switch (offlinePriceCents) {
          case (null) { bookOfflinePrices.remove(id) };
          case (?price) { bookOfflinePrices.add(id, price) };
        };
      };
    };
  };

  public shared ({ caller }) func deleteBook(id : Text) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can delete books");
    };
    switch (books.get(id)) {
      case (null) { Runtime.trap("Book not found") };
      case (?book) {
        if (book.author != caller and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: You can only delete your own books");
        };
        books.remove(id);
        bookOfflinePrices.remove(id);
        bookFiles.remove(id);
      };
    };
  };

  public shared query ({ caller }) func getBook(id : Text) : async ?BookFull {
    switch (books.get(id)) {
      case (null) { null };
      case (?book) {
        if (book.isPublished) { ?(enrichBook(book)) } else {
          if (book.author == caller or AccessControl.isAdmin(accessControlState, caller)) { ?(enrichBook(book)) } else { null };
        };
      };
    };
  };

  public shared query ({ caller }) func getAllBooks() : async [BookFull] {
    let allBooks = books.values().toArray();
    let filtered = if (AccessControl.isAdmin(accessControlState, caller)) { allBooks }
    else { allBooks.filter(func(b) { b.isPublished }) };
    filtered.map(enrichBook);
  };

  public shared query ({ caller }) func getMyBooks() : async [BookFull] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only creators can view their books");
    };
    books.values().toArray().filter(func(b) { b.author == caller }).map(enrichBook);
  };

  // ShortFilm Management
  public shared ({ caller }) func submitShortFilm(film : ShortFilm) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only creators can submit short films");
    };
    if (restrictedCreators.get(caller) == ?true) {
      Runtime.trap("Your account has been restricted from publishing by an admin");
    };
    if (film.director != caller) {
      Runtime.trap("Unauthorized: You can only submit short films as yourself");
    };
    shortFilms.add(film.id, film);
  };

  public shared ({ caller }) func editShortFilm(id : Text, film : ShortFilm) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only creators can edit short films");
    };
    switch (shortFilms.get(id)) {
      case (null) { Runtime.trap("Short film not found") };
      case (?existingFilm) {
        if (existingFilm.director != caller and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: You can only edit your own short films");
        };
        if (film.director != existingFilm.director) {
          Runtime.trap("Cannot change film director");
        };
        shortFilms.add(id, film);
      };
    };
  };

  public shared ({ caller }) func deleteShortFilm(id : Text) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can delete short films");
    };
    switch (shortFilms.get(id)) {
      case (null) { Runtime.trap("Short film not found") };
      case (?film) {
        if (film.director != caller and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: You can only delete your own short films");
        };
        shortFilms.remove(id);
      };
    };
  };

  public shared query ({ caller }) func getShortFilm(id : Text) : async ?ShortFilm {
    switch (shortFilms.get(id)) {
      case (null) { null };
      case (?film) {
        if (film.isPublished) { ?film } else {
          if (film.director == caller or AccessControl.isAdmin(accessControlState, caller)) { ?film } else { null };
        };
      };
    };
  };

  public shared query ({ caller }) func getAllShortFilms() : async [ShortFilm] {
    let allFilms = shortFilms.values().toArray();
    if (AccessControl.isAdmin(accessControlState, caller)) { allFilms }
    else { allFilms.filter(func(f) { f.isPublished }) };
  };

  public shared query ({ caller }) func getMyShortFilms() : async [ShortFilm] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only creators can view their short films");
    };
    shortFilms.values().toArray().filter(func(f) { f.director == caller });
  };

  public shared ({ caller }) func addPurchase(purchase : PurchaseRecord) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can add purchases");
    };
    purchases.add(purchase.id, purchase);
  };

  public shared query ({ caller }) func getPurchasesByBuyer(buyer : Principal) : async [PurchaseRecord] {
    if (caller != buyer and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: You can only view your own purchases");
    };
    purchases.values().toArray().filter(func(p) { p.buyerPrincipal == buyer });
  };

  public shared query ({ caller }) func getMyPurchases() : async [PurchaseRecord] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view purchases");
    };
    purchases.values().toArray().filter(func(p) { p.buyerPrincipal == caller });
  };

  public shared query ({ caller }) func getPurchasesByCreator(creator : Principal) : async [PurchaseRecord] {
    if (caller != creator and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: You can only view your own creator purchases");
    };
    purchases.values().toArray().filter(func(p) { p.creatorPrincipal == creator });
  };

  public shared query ({ caller }) func getMyEarnings() : async Nat {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only creators can view earnings");
    };
    let myPurchases = purchases.values().toArray().filter(func(p) { p.creatorPrincipal == caller });
    var total : Nat = 0;
    for (purchase in myPurchases.vals()) { total += purchase.creatorShareCents };
    total;
  };

  public shared query ({ caller }) func getAllPurchases() : async [PurchaseRecord] {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can view all purchases");
    };
    purchases.values().toArray();
  };

  public shared query ({ caller }) func getPublishedBooks() : async [BookFull] {
    books.values().toArray().filter(func(b) { b.isPublished }).map(enrichBook);
  };

  public shared query ({ caller }) func getPublishedShortFilms() : async [ShortFilm] {
    shortFilms.values().toArray().filter(func(f) { f.isPublished });
  };

  public shared ({ caller }) func approveContent(id : Text, contentType : Text) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can approve content");
    };
    switch (contentType) {
      case ("book") {
        switch (books.get(id)) {
          case (null) { Runtime.trap("Book not found") };
          case (?book) { books.add(id, { book with isPublished = true; publishedAt = ?Time.now() }) };
        };
      };
      case ("shortFilm") {
        switch (shortFilms.get(id)) {
          case (null) { Runtime.trap("Short film not found") };
          case (?film) { shortFilms.add(id, { film with isPublished = true; publishedAt = ?Time.now() }) };
        };
      };
      case (_) { Runtime.trap("Invalid content type") };
    };
  };

  public shared ({ caller }) func rejectContent(id : Text, contentType : Text) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can reject content");
    };
    switch (contentType) {
      case ("book") {
        switch (books.get(id)) {
          case (null) { Runtime.trap("Book not found") };
          case (?book) { books.add(id, { book with isPublished = false; publishedAt = null }) };
        };
      };
      case ("shortFilm") {
        switch (shortFilms.get(id)) {
          case (null) { Runtime.trap("Short film not found") };
          case (?film) { shortFilms.add(id, { film with isPublished = false; publishedAt = null }) };
        };
      };
      case (_) { Runtime.trap("Invalid content type") };
    };
  };

  public shared ({ caller }) func createStripeCheckoutSession(items : [Stripe.ShoppingItem], successUrl : Text, cancelUrl : Text, config : Stripe.StripeConfiguration) : async Text {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can create checkout sessions");
    };
    await Stripe.createCheckoutSession(config, caller, items, successUrl, cancelUrl, transform);
  };

  public shared ({ caller }) func assignRole(user : Principal, role : AccessControl.UserRole) : async () {
    AccessControl.assignRole(accessControlState, caller, user, role);
  };

  public shared query ({ caller }) func getAllPublishedContent() : async {
    books : [BookFull];
    shortFilms : [ShortFilm];
  } {
    {
      books = books.values().toArray().filter(func(b) { b.isPublished }).map(enrichBook);
      shortFilms = shortFilms.values().toArray().filter(func(f) { f.isPublished });
    };
  };

  public shared query ({ caller }) func fetchBooks() : async [BookFull] {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can fetch all books");
    };
    books.values().toArray().map(enrichBook);
  };

  public shared query ({ caller }) func fetchShortFilms() : async [ShortFilm] {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can fetch all short films");
    };
    shortFilms.values().toArray();
  };
};
