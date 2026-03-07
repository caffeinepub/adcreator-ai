import Text "mo:core/Text";
import Runtime "mo:core/Runtime";

actor {
  public type BusinessType = {
    #restaurant;
    #gym;
    #retail;
    #salon;
    #cafe;
  };
  public type Promotion = {
    description : Text;
    discount : ?Nat;
  };

  let businessTypeEmojis = [
    (#restaurant, "🍽️"),
    (#gym, "🏋️‍♂️"),
    (#retail, "🛍️"),
    (#salon, "✂️"),
    (#cafe, "☕"),
  ];

  let businessTypeHashtags = [
    (#restaurant, "#Foodie #EatLocal #Dining"),
    (#gym, "#Fitness #Workout #HealthyLifestyle"),
    (#retail, "#Shopping #Fashion #RetailTherapy"),
    (#salon, "#Beauty #HairCare #SelfCare"),
    (#cafe, "#CoffeeLover #CafeVibes #Brunch"),
  ];

  let cityHashtags = [
    ("New York", "#NYC #BigApple"),
    ("Los Angeles", "#LA #CityOfAngels"),
    ("Chicago", "#Chicago #WindyCity"),
    ("Houston", "#Houston #SpaceCity"),
    ("Miami", "#Miami #SouthBeach"),
  ];

  func getBusinessTypeEmoji(businessType : BusinessType) : Text {
    for ((t, e) in businessTypeEmojis.values()) {
      if (t == businessType) { return e };
    };
    Runtime.trap("Invalid business type");
  };

  func getBusinessTypeHashtags(businessType : BusinessType) : Text {
    for ((t, h) in businessTypeHashtags.values()) {
      if (t == businessType) { return h };
    };
    Runtime.trap("Invalid business type");
  };

  func getCityHashtags(city : Text) : Text {
    for ((c, h) in cityHashtags.values()) {
      if (city.contains(#text(c))) { return h };
    };
    "#LocalBusiness";
  };

  func formatDiscount(discount : ?Nat) : Text {
    switch (discount) {
      case (?d) { "Enjoy a " # d.toText() # "% discount!" };
      case (null) { "" };
    };
  };

  public shared ({ caller }) func generateAd(businessType : BusinessType, city : Text, promotion : Text, discount : ?Nat) : async Text {
    let cityFormatted = city.trimEnd(#char(' '));
    let emoji = getBusinessTypeEmoji(businessType);
    let businessTypeFormatted = businessType;
    let businessHashtags = getBusinessTypeHashtags(businessTypeFormatted);
    let cityTags = getCityHashtags(cityFormatted);
    let discountText = formatDiscount(discount);

    let ad =
      "🌟 " # emoji #
      " Welcome to " # cityFormatted #
      "'s premier " #
      promotion # " " # discountText #
      " Follow us for more updates. " # businessHashtags # " " # cityTags;

    ad.trimEnd(#char(' '));
  };
};
