import Map "mo:core/Map";
import Array "mo:core/Array";
import Iter "mo:core/Iter";
import Text "mo:core/Text";
import Time "mo:core/Time";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import Order "mo:core/Order";
import Nat "mo:core/Nat";
import AccessControl "authorization/access-control";
import Stripe "stripe/stripe";
import OutCall "http-outcalls/outcall";
import MixinAuthorization "authorization/MixinAuthorization";
import MixinStorage "blob-storage/Mixin";
import Storage "blob-storage/Storage";

actor {
  include MixinStorage();

  // User Role Setup
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  let userProfiles = Map.empty<Principal, UserProfile>();

  public type UserProfile = {
    name : Text;
    role : Text; // "creator" or "customer"
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

  module Book {
    public func compare(book1 : Book, book2 : Book) : Order.Order {
      Text.compare(book1.id, book2.id);
    };
  };

  module ShortFilm {
    public func compare(film1 : ShortFilm, film2 : ShortFilm) : Order.Order {
      Text.compare(film1.id, film2.id);
    };
  };

  let books = Map.empty<Text, Book>();
  let shortFilms = Map.empty<Text, ShortFilm>();
  let purchases = Map.empty<Text, PurchaseRecord>();

  var stripeConfiguration : ?Stripe.StripeConfiguration = null;

  // Required Functions for Stripe Integration
  public query ({ caller }) func isStripeConfigured() : async Bool {
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
      case (null) { Runtime.trap("Stripe needs to be first configured") };
      case (?value) { value };
    };
  };

  public query ({ caller }) func transform(input : OutCall.TransformationInput) : async OutCall.TransformationOutput {
    OutCall.transform(input);
  };

  public func getStripeSessionStatus(sessionId : Text) : async Stripe.StripeSessionStatus {
    await Stripe.getSessionStatus(getStripeConfiguration(), sessionId, transform);
  };

  public shared ({ caller }) func createCheckoutSession(items : [Stripe.ShoppingItem], successUrl : Text, cancelUrl : Text) : async Text {
    await Stripe.createCheckoutSession(getStripeConfiguration(), caller, items, successUrl, cancelUrl, transform);
  };

  // User Profile Management
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // Book Management
  public shared ({ caller }) func submitBook(book : Book) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only creators can submit books");
    };
    if (book.author != caller) {
      Runtime.trap("Unauthorized: You can only submit books as yourself");
    };
    books.add(book.id, book);
  };

  public shared ({ caller }) func editBook(id : Text, book : Book) : async () {
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
        books.add(id, book);
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
      };
    };
  };

  public query ({ caller }) func getBook(id : Text) : async ?Book {
    switch (books.get(id)) {
      case (null) { null };
      case (?book) {
        if (book.isPublished) {
          ?book;
        } else {
          if (book.author == caller or AccessControl.isAdmin(accessControlState, caller)) {
            ?book;
          } else {
            null;
          };
        };
      };
    };
  };

  public query ({ caller }) func getAllBooks() : async [Book] {
    let allBooks = books.values().toArray();
    if (AccessControl.isAdmin(accessControlState, caller)) {
      allBooks.sort();
    } else {
      allBooks.filter(func(b) { b.isPublished }).sort();
    };
  };

  public query ({ caller }) func getMyBooks() : async [Book] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only creators can view their books");
    };
    books.values().toArray().filter(func(b) { b.author == caller }).sort();
  };

  // ShortFilm Management
  public shared ({ caller }) func submitShortFilm(film : ShortFilm) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only creators can submit short films");
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

  public query ({ caller }) func getShortFilm(id : Text) : async ?ShortFilm {
    switch (shortFilms.get(id)) {
      case (null) { null };
      case (?film) {
        if (film.isPublished) {
          ?film;
        } else {
          if (film.director == caller or AccessControl.isAdmin(accessControlState, caller)) {
            ?film;
          } else {
            null;
          };
        };
      };
    };
  };

  public query ({ caller }) func getAllShortFilms() : async [ShortFilm] {
    let allFilms = shortFilms.values().toArray();
    if (AccessControl.isAdmin(accessControlState, caller)) {
      allFilms;
    } else {
      allFilms.filter(func(f) { f.isPublished });
    };
  };

  public query ({ caller }) func getMyShortFilms() : async [ShortFilm] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only creators can view their short films");
    };
    shortFilms.values().toArray().filter(func(f) { f.director == caller });
  };

  // Purchase Records Management
  public shared ({ caller }) func addPurchase(purchase : PurchaseRecord) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can add purchases");
    };
    if (purchase.buyerPrincipal != caller) {
      Runtime.trap("Unauthorized: You can only add purchases for yourself");
    };
    purchases.add(purchase.id, purchase);
  };

  public query ({ caller }) func getPurchasesByBuyer(buyer : Principal) : async [PurchaseRecord] {
    if (caller != buyer and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: You can only view your own purchases");
    };
    purchases.values().toArray().filter(func(p) { p.buyerPrincipal == buyer });
  };

  public query ({ caller }) func getMyPurchases() : async [PurchaseRecord] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view purchases");
    };
    purchases.values().toArray().filter(func(p) { p.buyerPrincipal == caller });
  };

  public query ({ caller }) func getPurchasesByCreator(creator : Principal) : async [PurchaseRecord] {
    if (caller != creator and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: You can only view your own creator purchases");
    };
    purchases.values().toArray().filter(func(p) { p.creatorPrincipal == creator });
  };

  public query ({ caller }) func getMyEarnings() : async Nat {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only creators can view earnings");
    };
    let myPurchases = purchases.values().toArray().filter(func(p) { p.creatorPrincipal == caller });
    var total : Nat = 0;
    for (purchase in myPurchases.vals()) {
      total += purchase.creatorShareCents;
    };
    total;
  };

  public query ({ caller }) func getAllPurchases() : async [PurchaseRecord] {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can view all purchases");
    };
    purchases.values().toArray();
  };

  // Utility Functions
  public query ({ caller }) func getPublishedBooks() : async [Book] {
    books.values().toArray().filter(func(b) { b.isPublished });
  };

  public query ({ caller }) func getPublishedShortFilms() : async [ShortFilm] {
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
          case (?book) {
            books.add(id, { book with isPublished = true; publishedAt = ?Time.now() });
          };
        };
      };
      case ("shortFilm") {
        switch (shortFilms.get(id)) {
          case (null) { Runtime.trap("Short film not found") };
          case (?film) {
            shortFilms.add(id, { film with isPublished = true; publishedAt = ?Time.now() });
          };
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
          case (?book) {
            books.add(id, { book with isPublished = false; publishedAt = null });
          };
        };
      };
      case ("shortFilm") {
        switch (shortFilms.get(id)) {
          case (null) { Runtime.trap("Short film not found") };
          case (?film) {
            shortFilms.add(id, { film with isPublished = false; publishedAt = null });
          };
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

  // Role Assignment (Admin Only)
  public shared ({ caller }) func assignRole(user : Principal, role : AccessControl.UserRole) : async () {
    AccessControl.assignRole(accessControlState, caller, user, role);
  };

  public query ({ caller }) func getAllPublishedContent() : async {
    books : [Book];
    shortFilms : [ShortFilm];
  } {
    {
      books = books.values().toArray().filter(func(b) { b.isPublished });
      shortFilms = shortFilms.values().toArray().filter(func(f) { f.isPublished });
    };
  };
};
