import Map "mo:core/Map";
import Principal "mo:core/Principal";

module {
  public type RateLimitData = {
    count : Nat;
    windowStart : Int;
  };

  public type Ad = {
    id : Nat;
    businessName : Text;
    imageUrl : ?Text;
    captionShort : Text;
    captionLong : Text;
    platform : Text;
    tone : Text;
    savedAt : Int;
  };

  public type OldActor = {
    adStore : Map.Map<Principal, Map.Map<Nat, Ad>>;
  };

  public type NewActor = {
    adStore : Map.Map<Principal, Map.Map<Nat, Ad>>;
    userRateLimits : Map.Map<Principal, RateLimitData>;
  };

  public func run(old : OldActor) : NewActor {
    { old with userRateLimits = Map.empty<Principal, RateLimitData>() };
  };
};
