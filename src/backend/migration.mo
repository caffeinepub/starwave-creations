import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Array "mo:core/Array";
import Text "mo:core/Text";
import Storage "blob-storage/Storage";
import Principal "mo:core/Principal";
import AccessControl "authorization/access-control";

module {
  // Old types for migration context
  type OldShortFilm = {
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

  type OldBook = {
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

  type OldUserProfile = {
    name : Text;
    role : Text;
  };

  type OldActor = {
    accessControlState : AccessControl.AccessControlState;
    stripeConfiguration : ?{ secretKey : Text; allowedCountries : [Text] };
    userProfiles : Map.Map<Principal, OldUserProfile>;
    books : Map.Map<Text, OldBook>;
    shortFilms : Map.Map<Text, OldShortFilm>;
  };

  // New types
  type NewUserProfile = {
    name : Text;
    role : Text;
    phone : ?Text;
    email : ?Text;
  };

  type NewBook = {
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

  type NewActor = {
    accessControlState : AccessControl.AccessControlState;
    stripeConfiguration : ?{ secretKey : Text; allowedCountries : [Text] };
    userProfiles : Map.Map<Principal, NewUserProfile>;
    books : Map.Map<Text, NewBook>;
    shortFilms : Map.Map<Text, OldShortFilm>;
  };

  public func run(old : OldActor) : NewActor {
    let newAccessControlState = old.accessControlState;
    let newUserProfiles = old.userProfiles.map<Principal, OldUserProfile, NewUserProfile>(
      func(_principal, oldProfile) {
        {
          oldProfile with
          phone = null;
          email = null;
        };
      }
    );

    let newBooks = old.books.map<Text, OldBook, NewBook>(
      func(_text, oldBook) {
        {
          oldBook with
          offlineLocation = null;
        };
      }
    );
    {
      old with userProfiles = newUserProfiles; books = newBooks;
    };
  };
};
