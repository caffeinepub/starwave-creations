import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Storage "blob-storage/Storage";
import AccessControl "authorization/access-control";

module {
  type OldActor = {
    accessControlState : AccessControl.AccessControlState;
    userProfiles : Map.Map<Principal, { name : Text; role : Text }>;
    books : Map.Map<Text, { id : Text; title : Text; description : Text; author : Principal; coverImageId : Storage.ExternalBlob; priceCents : Nat; genre : Text; publishedAt : ?Int; isPublished : Bool }>;
    shortFilms : Map.Map<Text, { id : Text; title : Text; description : Text; director : Principal; videoId : Storage.ExternalBlob; thumbnailId : Storage.ExternalBlob; duration : Nat; genre : Text; publishedAt : ?Int; isPublished : Bool }>;
    purchases : Map.Map<Text, { id : Text; bookId : Text; buyerPrincipal : Principal; creatorPrincipal : Principal; totalAmountCents : Nat; creatorShareCents : Nat; adminShareCents : Nat; stripePaymentIntentId : Text; purchasedAt : Int }>;
    stripeConfiguration : ?{
      secretKey : Text;
      allowedCountries : [Text];
    };
  };

  type Book = {
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

  type NewActor = {
    accessControlState : AccessControl.AccessControlState;
    userProfiles : Map.Map<Principal, { name : Text; role : Text }>;
    books : Map.Map<Text, Book>;
    shortFilms : Map.Map<Text, { id : Text; title : Text; description : Text; director : Principal; videoId : Storage.ExternalBlob; thumbnailId : Storage.ExternalBlob; duration : Nat; genre : Text; publishedAt : ?Int; isPublished : Bool }>;
    purchases : Map.Map<Text, { id : Text; bookId : Text; buyerPrincipal : Principal; creatorPrincipal : Principal; totalAmountCents : Nat; creatorShareCents : Nat; adminShareCents : Nat; stripePaymentIntentId : Text; purchasedAt : Int }>;
    stripeConfiguration : ?{
      secretKey : Text;
      allowedCountries : [Text];
    };
  };

  public func run(old : OldActor) : NewActor { old };
};
