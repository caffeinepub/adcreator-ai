import Map "mo:core/Map";
import Array "mo:core/Array";
import Nat "mo:core/Nat";
import Text "mo:core/Text";
import Time "mo:core/Time";
import Order "mo:core/Order";
import Iter "mo:core/Iter";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";

import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";



actor {
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // User Profile Type
  public type UserProfile = {
    name : Text;
  };

  let userProfiles = Map.empty<Principal, UserProfile>();
  let userRegistrationDates = Map.empty<Principal, Int>();

  // Ad Types
  type Ad = {
    id : Nat;
    businessName : Text;
    imageUrl : ?Text;
    captionShort : Text;
    captionLong : Text;
    platform : Text;
    tone : Text;
    savedAt : Int;
  };

  // Rate Limiting Data Types
  public type RateLimitData = {
    count : Nat;
    windowStart : Int;
  };

  let DEFAULT_RATE_LIMIT : Nat = 3;
  // 24h in nanoseconds to use with Time.now() which also returns in ns
  let DEFAULT_TIME_WINDOW : Int = 24 * 60 * 60 * 1_000_000_000;

  let userRateLimits = Map.empty<Principal, RateLimitData>();

  // Feedback Data Types
  public type Feedback = {
    id : Nat;
    userEmail : Text;
    message : Text;
    submittedAt : Int;
    userName : Text;
  };

  let feedbackStore = Map.empty<Nat, Feedback>();
  var nextFeedbackId = 0;

  // Ad Generation Types
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

  let adStore = Map.empty<Principal, Map.Map<Nat, Ad>>();
  var nextAdId = 1;

  public type DailyUsageStats = {
    count : Nat;
    limit : Nat;
    resetAt : Int;
  };

  public type SaveAdInput = {
    businessName : Text;
    imageUrl : ?Text;
    captionShort : Text;
    captionLong : Text;
    platform : Text;
    tone : Text;
  };

  public type AdminAnalytics = {
    totalUsers : Nat;
    activeUsersToday : Nat;
    totalAdsGenerated : Nat;
    totalImagesGenerated : Nat;
    topBusinessTypes : [{ businessType : Text; count : Nat }];
    platformCounts : [{ platform : Text; count : Nat }];
    weeklyActivity : [{ day : Text; count : Nat }];
  };

  public type UserWithAds = {
    principal : Principal;
    name : Text;
    registeredAt : Int;
    adCount : Nat;
  };

  public type UpdateAdsInput = {
    ads : [Ad];
  };

  func recordRegistration(caller : Principal) {
    if (not userRegistrationDates.containsKey(caller)) {
      userRegistrationDates.add(caller, Time.now());
    };
  };

  // User Profile Functions
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access profiles");
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
    recordRegistration(caller);
  };

  // Helper for getting or creating Ad store
  func getCallerAdStore(caller : Principal, createIfMissing : Bool) : Map.Map<Nat, Ad> {
    switch (adStore.get(caller)) {
      case (?store) { store };
      case (null) {
        if (createIfMissing) {
          let newStore = Map.empty<Nat, Ad>();
          adStore.add(caller, newStore);
          newStore;
        } else {
          Runtime.trap("No ads found for this user");
        };
      };
    };
  };

  // Ad Management with Daily Limit Check
  public shared ({ caller }) func saveAd(input : SaveAdInput) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save ads");
    };

    await checkAndIncrementDailyUsage(caller);

    let newAd = {
      id = nextAdId;
      businessName = input.businessName;
      imageUrl = input.imageUrl;
      captionShort = input.captionShort;
      captionLong = input.captionLong;
      platform = input.platform;
      tone = input.tone;
      savedAt = Time.now();
    };

    nextAdId += 1;
    let callerStore = getCallerAdStore(caller, true);
    callerStore.add(newAd.id, newAd);
    switch (adStore.get(caller)) {
      case (?_) {};
      case (null) { adStore.add(caller, callerStore) };
    };
    recordRegistration(caller);
  };

  // Get Sorted Ads for Caller
  func compareAdsBySavedAt(a : Ad, b : Ad) : Order.Order {
    Nat.compare(b.savedAt.toNat(), a.savedAt.toNat());
  };

  public query ({ caller }) func getAdsForCaller() : async [Ad] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access their ads");
    };
    let callerStore = getCallerAdStore(caller, false);
    let ads = callerStore.values().toArray();
    let sortedAds = ads.sort(compareAdsBySavedAt);
    sortedAds;
  };

  // Update All Ads (used for migration)
  public shared ({ caller }) func updateAllAds(input : UpdateAdsInput) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update their ads");
    };
    let callerStore = getCallerAdStore(caller, true);
    callerStore.clear();
    for (ad in input.ads.values()) {
      callerStore.add(ad.id, ad);
    };
  };

  // Delete Ad
  public shared ({ caller }) func deleteAd(adId : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete ads");
    };
    let callerStore = getCallerAdStore(caller, false);
    if (callerStore.containsKey(adId)) {
      callerStore.remove(adId);
    } else {
      Runtime.trap("Ad not found or belongs to another user");
    };
  };

  // Business Type Helpers
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

  // Ad Generation Open to All
  public shared ({ caller }) func generateAd(
    businessType : BusinessType,
    city : Text,
    promotion : Text,
    discount : ?Nat,
  ) : async Text {
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

  // Daily Limit Helper Functions
  func resetDailyLimitIfNeeded(caller : Principal, rateLimit : RateLimitData) : ?RateLimitData {
    let now = Time.now();
    if ((now - rateLimit.windowStart) > DEFAULT_TIME_WINDOW) {
      let newLimit = {
        count = 1;
        windowStart = now;
      };
      userRateLimits.add(caller, newLimit);
      ?newLimit;
    } else { null };
  };

  // Query Current Usage
  public query ({ caller }) func getDailyUsage() : async DailyUsageStats {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view their daily usage");
    };
    let now = Time.now();
    let rateLimit = switch (userRateLimits.get(caller)) {
      case (?rate) {
        let wasReset = resetDailyLimitIfNeeded(caller, rate);
        switch (wasReset) {
          case (?reset) {
            {
              count = reset.count;
              limit = DEFAULT_RATE_LIMIT;
              resetAt = now + DEFAULT_TIME_WINDOW;
            };
          };
          case (null) {
            {
              count = rate.count;
              limit = DEFAULT_RATE_LIMIT;
              resetAt = rate.windowStart + DEFAULT_TIME_WINDOW;
            };
          };
        };
      };
      case (null) {
        let newLimit = {
          count = 0;
          windowStart = now;
        };
        {
          count = newLimit.count;
          limit = DEFAULT_RATE_LIMIT;
          resetAt = newLimit.windowStart + DEFAULT_TIME_WINDOW;
        };
      };
    };
    rateLimit;
  };

  // Check and Enforce Limit
  func checkAndIncrementDailyUsage(caller : Principal) : async () {
    let now = Time.now();
    let rateLimit = switch (userRateLimits.get(caller)) {
      case (?rate) {
        let wasReset = resetDailyLimitIfNeeded(caller, rate);
        switch (wasReset) {
          case (?_) { return };
          case (null) {
            if (rate.count >= DEFAULT_RATE_LIMIT) {
              Runtime.trap("Daily usage limit reached. Try again later.");
            } else {
              let newLimit = {
                count = rate.count + 1;
                windowStart = rate.windowStart;
              };
              userRateLimits.add(caller, newLimit);
            };
          };
        };
      };
      case (null) {
        let newLimit = {
          count = 1 : Nat;
          windowStart = now;
        };
        userRateLimits.add(caller, newLimit);
      };
    };
  };

  // Feedback System Functions
  public shared ({ caller }) func submitFeedback(email : Text, message : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can submit feedback");
    };

    let userName = switch (userProfiles.get(caller)) {
      case (?profile) { profile.name };
      case (null) { "Usuario" };
    };

    let feedback = {
      id = nextFeedbackId;
      userEmail = email;
      message;
      submittedAt = Time.now();
      userName;
    };

    feedbackStore.add(nextFeedbackId, feedback);
    nextFeedbackId += 1;
  };

  func compareBySubmittedAt(a : Feedback, b : Feedback) : Order.Order {
    if (a.submittedAt > b.submittedAt) {
      #less;
    } else if (a.submittedAt < b.submittedAt) {
      #greater;
    } else { #equal };
  };

  public query ({ caller }) func getAllFeedback() : async [Feedback] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can view feedback");
    };

    let feedbackArray = feedbackStore.values().toArray();
    let sortedFeedback = feedbackArray.sort(
      func(a, b) { compareBySubmittedAt(a, b) }
    );

    sortedFeedback;
  };

  func getRegistrationDate(principal : Principal) : Int {
    switch (userRegistrationDates.get(principal)) {
      case (?date) { date };
      case (null) { 0 };
    };
  };

  func isAdFromToday(savedAt : Int) : Bool {
    let now = Time.now();
    // 24h in nanos
    let dayInNanos = 24 * 60 * 60 * 1_000_000_000;
    (now - savedAt) <= dayInNanos;
  };

  func countPlatformAds(platform : Text) : Nat {
    var count = 0;
    for ((_, store) in adStore.entries()) {
      for ((_, ad) in store.entries()) {
        if (ad.platform == platform) {
          count += 1;
        };
      };
    };
    count;
  };

  func getTopBusinessTypes() : [{ businessType : Text; count : Nat }] {
    let businessTypeCounts = Map.empty<Text, Nat>();

    for ((_, store) in adStore.entries()) {
      for ((_, ad) in store.entries()) {
        let currentCount = switch (businessTypeCounts.get(ad.businessName)) {
          case (?count) { count };
          case (null) { 0 };
        };
        businessTypeCounts.add(ad.businessName, currentCount + 1);
      };
    };

    let businessTypeCountsArray = businessTypeCounts.entries().toArray().map(
      func((businessType, count)) {
        { businessType; count };
      }
    );

    let sortedCounts = businessTypeCountsArray.sort(
      func(a, b) { Nat.compare(b.count, a.count) }
    );

    sortedCounts.sliceToArray(0, Nat.min(5, sortedCounts.size()));
  };

  func getWeeklyActivity() : [{ day : Text; count : Nat }] {
    let dayNames = ["dom", "lun", "mar", "mie", "jue", "vie", "sab"];

    Array.tabulate<{ day : Text; count : Nat }>(
      7,
      func(i) {
        { day = dayNames[i]; count = 0 };
      },
    );
  };

  func compareUsersByRegistration(a : UserWithAds, b : UserWithAds) : Order.Order {
    Nat.compare(b.registeredAt.toNat(), a.registeredAt.toNat());
  };

  public query ({ caller }) func getAllUsersForAdmin() : async [UserWithAds] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };

    let usersWithAds = userProfiles.entries().map(
      func((principal, profile)) {
        let adCount = initAdStore(principal).size();
        let registeredAt = getRegistrationDate(principal);
        {
          principal;
          name = profile.name;
          registeredAt;
          adCount;
        };
      }
    ).toArray();

    usersWithAds.sort(compareUsersByRegistration);
  };

  public query ({ caller }) func getAdminAnalytics() : async AdminAnalytics {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };

    let totalUsers = userProfiles.size();
    let adEntries = adStore.entries().toArray();

    let (totalAds, totalImages, activeUsersCount) = adEntries.foldLeft(
      (0, 0, 0),
      func((ads, images, activeUsers), (principal, store)) {
        let storeAds = store.values().toArray();
        let imagesCount = storeAds.filter(func(ad) { ad.imageUrl != null }).size();
        let hasActiveAd = storeAds.filter(func(ad) { isAdFromToday(ad.savedAt) }).size() > 0;
        (
          ads + store.size(),
          images + imagesCount,
          activeUsers + (if (hasActiveAd) { 1 } else { 0 }),
        );
      },
    );

    let platformCounts = [
      { platform = "instagram"; count = countPlatformAds("instagram") },
      { platform = "facebook"; count = countPlatformAds("facebook") },
      { platform = "tiktok"; count = countPlatformAds("tiktok") },
    ];

    let topBusinessTypes = getTopBusinessTypes();

    let weeklyActivity = getWeeklyActivity();

    {
      totalUsers;
      activeUsersToday = activeUsersCount;
      totalAdsGenerated = totalAds;
      totalImagesGenerated = totalImages;
      topBusinessTypes;
      platformCounts;
      weeklyActivity;
    };
  };

  func initAdStore(principal : Principal) : Map.Map<Nat, Ad> {
    switch (adStore.get(principal)) {
      case (?store) { store };
      case (null) {
        let newStore = Map.empty<Nat, Ad>();
        adStore.add(principal, newStore);
        newStore;
      };
    };
  };
};
