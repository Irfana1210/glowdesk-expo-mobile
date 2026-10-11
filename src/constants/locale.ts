/** All user-facing copy. Australian English. Screens read it through a scoped const. */
const plural = (
  count: number,
  singular: string,
  pluralForm = `${singular}s`,
) => (count === 1 ? singular : pluralForm);

export namespace LOCALE {
  export const errors = {
    generic: "Something went wrong. Try again.",
    /** Copy for API error codes. Codes without copy fall back to the server message. */
    byCode: {
      ACCOUNT_INACTIVE:
        "This account is no longer active. Ask your store manager.",
      INVALID_CREDENTIALS:
        "That staff ID and PIN don't match. Check them and try again.",
      FORBIDDEN: "Only managers can see this.",
      NETWORK: "You're offline. Check your connection and try again.",
      NOT_FOUND: "That record no longer exists.",
      SERVER_ERROR: "The server couldn't complete that. Try again.",
      SESSION_EXPIRED: "Your session has expired. Sign in again.",
      UNKNOWN: "Something went wrong. Try again.",
      VERSION_CONFLICT:
        "This order changed on another device. Showing the latest version.",
    } as Partial<Record<string, string>>,
  };

  /** Connectivity and the offline queue. */
  export const sync = {
    changes: (count: number) =>
      `${count} ${count === 1 ? "change" : "changes"}`,
    needsConnection:
      "You're offline. This needs the server to confirm it, so try again when you're back online.",
    offlineSaved:
      "Showing saved data. Changes you make will sync when you're back online.",
    offlineTitle: "You're offline",
    offlineWaiting: (changes: string) => `${changes} waiting to sync.`,
    orderWaiting:
      "Changes to this order are saved on this device and waiting to sync.",
    syncing: (changes: string) => `Back online. Syncing ${changes}…`,
    waitingBadge: "Waiting to sync",
  };

  export const auth = {
    signIn: {
      brandLabel: (store: string) => `Glowdesk, ${store}`,
      credentials: (staffId: string, pin: string) => `${staffId} · PIN ${pin}`,
      pin: "PIN",
      quickHint: "Signs in as this person",
      quickLabel: (name: string, role: string, staffId: string) =>
        `Quick sign-in as ${name}, ${role}, ${staffId}`,
      quickSignIn: "Quick sign-in",
      staffId: "Staff ID",
      staffIdPlaceholder: "e.g. RO1001",
      submit: "Sign in",
      submitHint: "Signs in with the staff ID and PIN above",
      subtitle: "Sign in with your staff ID and 4-digit PIN.",
      title: "Welcome back",
    },
    validation: {
      pin: "Enter your 4-digit PIN",
      staffId: "Enter your staff ID, like RO1001",
    },
  };

  export const app = {
    format: {
      am: "am",
      days: (count: number) => `${count} ${count === 1 ? "day" : "days"}`,
      hours: (hours: number) => `${hours}h`,
      hoursMinutes: (hours: number, minutes: number) => `${hours}h ${minutes}m`,
      minutes: (minutes: number) => `${minutes} min`,
      months: [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ],
      notAvailable: "—",
      pm: "pm",
      today: (time: string) => `Today, ${time}`,
      unknownTime: "Unknown time",
      weekdays: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
      yesterday: (time: string) => `Yesterday, ${time}`,
    },
    more: {
      employees: { description: "Planned", label: "Employees" },
      itemSummary: (label: string, description: string) =>
        `${label}, ${description}`,
      labour: {
        description: "Roster cost, budget and labour %",
        label: "Labour Management",
      },
      salesAnalytics: { description: "Planned", label: "Sales Analytics" },
      settings: {
        description: "Profile, store, preferences and sign out",
        label: "Settings",
      },
      title: "More",
      version: (version: string) => `Glowdesk v${version}`,
    },
    notFound: {
      action: "Go to orders",
      header: "Page not found",
      message: "The link may be out of date.",
      title: "This screen doesn't exist",
    },
    tabs: {
      dashboard: "Dashboard",
      inventory: "Inventory",
      more: "More",
      orders: "Orders",
      roster: "Roster",
    },
  };

  export const components = {
    appHeader: {
      back: "Go back",
    },
    barcodeCamera: {
      allowCamera: "Allow camera",
      checkingAccess: "Checking camera access",
      mountErrorFallback: "The camera could not start.",
      mountErrorMessage: (error: string) => `${error} Use manual entry below.`,
      openSettings: "Open Settings",
      pausedLabel: "Scanning paused",
      pausedViewfinder: "Scanning paused.",
      permissionMessage:
        "Allow the camera to scan product barcodes, or enter barcodes manually below.",
      permissionTitle: "Camera access needed",
      unavailableTitle: "Camera unavailable",
      viewfinder: "Camera viewfinder. Point at a product barcode.",
    },
    confirmationModal: {
      cancel: "Cancel",
      dismiss: "Dismiss",
    },
    errorState: {
      retry: "Try again",
      title: "Something went wrong",
    },
    filterChips: {
      optionWithCount: (label: string, count: number) =>
        `${label}, ${count} orders`,
    },
    loadingState: {
      message: "Loading…",
    },
    manualBarcodeEntry: {
      hint: "Use this if the barcode will not scan, or on a simulator.",
      label: "Enter barcode manually",
      placeholder: "e.g. 9300601042118",
      submit: "Verify barcode",
    },
    optionSheet: {
      close: "Close",
    },
    orderCard: {
      hint: "Opens order details",
      orderNumber: (orderNumber: string) => `#ORD-${orderNumber}`,
    },
    productRow: {
      toScan: "To scan",
      verified: "Verified",
    },
    searchBar: {
      clear: "Clear search",
    },
    selectField: {
      close: "Close",
      hint: "Opens a list of options",
      notSelected: "not selected",
      placeholder: "Select",
      summary: (label: string, value: string) => `${label}, ${value}`,
    },
    shiftCard: {
      label: "Your shift",
      progress: "Shift progress",
    },
    shiftRow: {
      edit: (name: string) => `Edit shift for ${name}`,
    },
    statusBadge: {
      label: (status: string) => `Status: ${status}`,
    },
  };

  export const dashboard = {
    screen: {
      greeting: (name: string) => `Hi, ${name}`,
      notificationsLabel: (count: number) =>
        `Notifications, ${count} ${count === 1 ? "item needs" : "items need"} attention`,
      profileLabel: (name: string) => `Profile and settings, ${name}`,
    },
    greeting: {
      morning: "Good morning",
      afternoon: "Good afternoon",
      evening: "Good evening",
    },
    shiftCard: {
      noValue: "—",
      stats: {
        onTheFloor: "on the floor",
        nextBreak: "next break",
        /** Whose break the "next break" time is: anyone in the store, not only the signed-in person. */
        breakOf: (firstName: string) => `${firstName}'s break`,
        yourBreak: "your break",
        ordersToAssign: (count: number) =>
          count === 1 ? "order to assign" : "orders to assign",
      },
      notRostered: {
        status: "Not rostered",
        timeRange: "No shift today",
        headline: "Day off",
      },
      upcoming: {
        status: "Starts later",
        headline: (duration: string) => `Starts in ${duration}`,
      },
      finished: {
        status: "Shift finished",
        headline: "All done today",
      },
      active: {
        status: "On shift",
        headline: (duration: string) => `${duration} left`,
      },
    },
    attention: {
      title: "Needs attention",
      count: (count: number) => (count === 1 ? "1 item" : `${count} items`),
      empty: "Nothing needs attention right now.",
      orders: {
        title: (count: number) =>
          `${count} ${count === 1 ? "order" : "orders"} overdue`,
        subtitle: (duration: string) =>
          `Oldest has waited ${duration} past due`,
      },
      breakCover: {
        title: (time: string) => `Break cover at ${time}`,
        subtitle: (name: string, minutes: number) =>
          `${name} · ${minutes} min break`,
        fallbackName: "Team member",
      },
      stock: {
        title: (count: number) =>
          `${count} ${count === 1 ? "product" : "products"} low or out`,
        subtitle: (product: string, more: number) =>
          `${product}${more > 0 ? ` and ${more} more` : ""}`,
      },
    },
    today: {
      title: "Today so far",
      loading: "Loading today's sales",
      errorTitle: "Couldn't load sales",
    },
    salesHero: {
      label: "Sales",
      totalLabel: (amount: string) => `Today's sales ${amount}`,
      noTarget: "No sales target set for today",
      targetReached: (target: string) => `Target ${target} reached`,
      toGo: (remaining: string, target: string) =>
        `${remaining} to go · target ${target}`,
      achievementLabel: (percent: string, remaining: string) =>
        `Sales target achievement ${percent}. ${remaining}`,
      achievementUnavailable: "Sales target achievement not available",
    },
    kpis: {
      notAvailable: "not available",
      noValue: "—",
      transactions: {
        label: "Transactions",
        supporting: (time: string) => `Since ${time}`,
      },
      averageTransaction: {
        label: "Avg transaction",
        supporting: "Sales ÷ transactions",
        accessibilityLabel: (value: string) =>
          `Average transaction value, ${value}`,
      },
      labour: {
        label: "Labour",
        ofSales: (amount: string) => `${amount} of sales`,
        accessibilityLabel: (share: string, spend: string) =>
          `Labour, ${share}, ${spend} estimated spend`,
      },
      clickAndCollect: {
        label: "Click & Collect",
        hint: "Opens Click & Collect orders",
        readyToCollect: (count: number) => `${count} ready to collect`,
        loading: "Loading orders",
      },
    },
    salesChart: {
      title: "Sales by hour",
      empty: "No hourly sales recorded yet today.",
      peak: (hour: string, amount: string) => `Peak ${hour} · ${amount}`,
      noSalesSummary: "No sales recorded yet today.",
      hourRange: (from: string, to: string) => `${from} to ${to}`,
      summary: (range: string, peakSales: string, peakHour: string) =>
        `Hourly sales from ${range}, peaking at ${peakSales} at ${peakHour}.`,
      stillToCome: (range: string) => `${range} still to come.`,
      tooltipSales: (amount: string) => `Sales ${amount}`,
      tooltipTarget: (amount: string) => `Target ${amount}`,
      tooltipUpcoming: "Still to come",
      barLabel: (hour: string, sales: string | null, target: string) =>
        sales === null
          ? `${hour}, still to come, target ${target}`
          : `${hour}, sales ${sales}, target ${target}`,
      barHint: "Shows this hour's sales and target",
      legend: {
        done: "Done",
        thisHour: "This hour",
        stillToCome: "Still to come",
      },
    },
  };

  export const inventory = {
    stockStatus: {
      inStock: "In stock",
      lowStock: "Low stock",
      outOfStock: "Out of stock",
    },
    barcodeLookup: {
      invalid: "Enter a valid barcode of 8 to 14 digits.",
      notFound: (barcode: string) =>
        `No product in this store has barcode ${barcode}.`,
    },
    list: {
      eyebrow: "Stock on hand",
      title: "Inventory",
      loading: "Loading inventory",
      errorTitle: "Couldn't load inventory",
      searchLabel: "Search inventory by product, SKU or barcode",
      searchPlaceholder: "Product, SKU or barcode",
      scanLabel: "Scan a barcode",
      categoryFilterLabel: "Filter by category",
      allCategories: "All",
      clearFilters: "Clear filters",
      empty: {
        noMatch: (query: string) => `No products match "${query}".`,
        noLowStock: "Nothing is low or out of stock.",
        noProducts: "No products in this category yet.",
      },
      summary: {
        label: "Stock summary",
        products: "products",
        lowStock: "low stock",
        outOfStock: "out of stock",
        countLabel: (count: number, label: string) => `${count} ${label}`,
        showAllHint: "Shows all products again",
        showRestockHint: "Shows only products that need restocking",
      },
    },
    productCard: {
      detail: (category: string, sku: string) => `${category} · SKU ${sku}`,
      accessibilityLabel: (
        brand: string,
        name: string,
        detail: string,
        quantity: number,
        status: string,
      ) => `${brand} ${name}, ${detail}, ${quantity} on hand, ${status}`,
    },
    productDetails: {
      title: "Product details",
      loading: "Loading product",
      errorTitle: "Couldn't load product",
      notFoundTitle: "Product not found",
      notFoundMessage: (id: string) =>
        `No product with ID ${id} in this store.`,
      backToInventory: "Back to inventory",
      available: "Available",
      availableLabel: (count: number) => `${count} available`,
      infoTitle: "Product information",
      rowLabel: (label: string, value: string) => `${label}: ${value}`,
      fields: {
        sku: "SKU",
        barcode: "Barcode",
        category: "Category",
        price: "Price",
        reorderPoint: "Reorder point",
      },
      stockMessage: {
        outOfStock:
          "Out of stock. Reorder now and remove from Click & Collect availability.",
        lowStock: (available: number, reorderPoint: number) =>
          `Low stock. ${available} left, at or below the reorder point of ${reorderPoint}.`,
        healthy: (reorderPoint: number) =>
          `Healthy stock. Reorder point is ${reorderPoint}.`,
      },
    },
    scan: {
      title: "Scan product",
      loading: "Loading inventory",
      errorTitle: "Couldn't load inventory",
      submitLabel: "Find product",
    },
  };

  export const labour = {
    restricted: {
      message:
        "Labour costs include confidential pay information, so only store managers can view them.",
      title: "Managers only",
    },
    labour: {
      adjustShifts: "Adjust shifts in the roster",
      adjustShiftsHint: "Costs here update as soon as shifts change",
      budgetLabel: "Labour budget",
      budgetOver: (amount: string) => `${amount} over budget`,
      budgetRemaining: (amount: string) => `${amount} remaining`,
      costByEmployee: "Cost by employee",
      costLabel: "Estimated roster cost",
      dailyCost: "Daily labour cost",
      dayA11y: (day: string, cost: string, hours: string) =>
        `${day}: ${cost}, ${hours} paid`,
      disclaimer:
        "Estimate only: paid hours × base hourly rate. Not a payroll calculation. Award penalty rates, overtime, allowances and superannuation are not included.",
      employeeA11y: (
        name: string,
        cost: string,
        hours: string,
        shifts: number,
      ) => `${name}: ${cost}, ${hours} over ${shifts} shifts`,
      employeeMeta: (role: string, hours: string, shifts: number) =>
        `${role} · ${hours} · ${shifts} shifts`,
      forecast: (amount: string) => `Forecast ${amount}`,
      missingRates: (count: number) =>
        `No pay rate for ${count} rostered employee(s). Their shifts are not included in the cost.`,
      noShifts: "No shifts rostered this week.",
      paid: (hours: string) => `${hours} paid`,
      percentA11y: (value: string) =>
        `Labour percentage of forecast sales, ${value}`,
      percentLabel: "Labour % of forecast sales",
      percentNotAvailable: "not available",
      title: "Labour Management",
      loadErrorMessage:
        "Labour costs need the roster, staff and pay rates. Check your connection and try again.",
      loadErrorTitle: "Couldn't load labour costs",
      loading: "Loading labour costs…",
      unknown: "Unknown",
      unknownEmployee: "Unknown employee",
    },
  };

  export const orders = {
    /** Copy shared by the details, scanner and completion screens. */
    common: {
      backToOrder: "Back to order",
      backToOrders: "Back to orders",
      loadingOrder: "Loading order",
      orderNotFound: "Order not found",
    },

    status: {
      new: "New",
      picking: "Picking",
      ready: "Ready",
      collected: "Collected",
      cancelled: "Cancelled",
    },

    list: {
      eyebrow: "Click & Collect",
      title: "Orders",
      openSearch: "Search orders",
      closeSearch: "Close search",
      searchAccessibilityLabel:
        "Search orders by number, customer initials or team member",
      searchPlaceholder: "Order number, initials or team member",
      filterAccessibilityLabel: "Filter orders by status",
      filters: {
        all: "All",
        new: "New",
        picking: "Picking",
        ready: "Ready",
        collected: "Collected",
      },
      empty: {
        all: "No Click & Collect orders yet.",
        new: "No new orders.",
        picking: "Nothing being picked.",
        ready: "No orders ready for collection.",
        collected: "No collected orders.",
        fallback: "No orders.",
        noMatch: (query: string) => `No orders match "${query}".`,
      },
      loading: "Loading Click & Collect orders",
      loadErrorTitle: "Couldn't load orders",
      loadErrorMessage: "Check your connection and try again.",
      refreshFailed: (error: string) => `Refresh failed: ${error}`,
      overdueBanner: (count: number) => `${count} overdue · shown first`,
      overdueBannerAccessibilityLabel: (count: number) =>
        `${count} ${plural(count, "order is", "orders are")} overdue and shown first`,
    },

    /** The order card text built in presentation.ts. */
    card: {
      yesterday: "yesterday",
      overdue: (duration: string) => `Overdue ${duration}`,
      due: (time: string) => `Due ${time}`,
      ready: "Ready",
      waiting: (duration: string) => `Waiting ${duration}`,
      collected: "Collected",
      cancelled: "Cancelled",
      notPicked: "Not picked",
      unassigned: "Unassigned",
      packedBy: (name: string) => `Packed by ${name}`,
      itemCount: (count: number) => `${count} ${plural(count, "item")}`,
      summary: (items: string, placed: string) => `${items} · placed ${placed}`,
      accessibilityLabel: (
        number: string,
        status: string,
        timing: string,
        assignee: string,
        items: string,
      ) => `Order ${number}, ${status}, ${timing}, ${assignee}, ${items}`,
    },

    details: {
      title: "Order details",
      moreActions: "More order actions",
      notFoundMessage: (id: string) =>
        `We couldn't find order ${id}. It may have been removed.`,
      orderNumber: (number: string) => `#ORD-${number}`,
      orderNumberAccessibilityLabel: (number: string) => `Order ${number}`,
      customer: (initials: string) => `Customer ${initials}`,
      customerAccessibilityLabel: (
        spokenInitials: string,
        placed: string,
        due: string,
      ) => `Customer ${spokenInitials}, placed ${placed}, due ${due}`,
      placed: (placed: string) => `Placed ${placed}`,
      due: (time: string) => ` · due ${time}`,
      overdue: (duration: string) => `Overdue ${duration}`,
      packedByPrefix: "Packed by ",
      assignedToPrefix: "Assigned to ",
      notAssigned: "Not assigned yet",
      assign: "Assign",
      reassign: "Reassign",
      assignAccessibilityLabel: "Assign this order",
      reassignAccessibilityLabel: (name: string) =>
        `Reassign, currently ${name}`,
      assignOrderTitle: "Assign order",
      reassignOrderTitle: "Reassign order",
      unassign: "Unassign",
      unassignDescription: "Return the order to the unassigned queue",
      assignedAnnouncement: (name: string) => `Assigned to ${name}`,
      unassignedAnnouncement: "Order unassigned",
      pickingStartedAnnouncement: "Picking started",
      progress: (picked: number, total: number) =>
        `${picked} of ${total} ${plural(total, "unit")} picked`,
      progressAccessibilityLabel: (picked: number, total: number) =>
        `Picking progress: ${picked} of ${total} ${plural(total, "unit")} picked`,
      productsHeading: (count: number) => `Products · ${count}`,
      productDetail: (sku: string, barcode: string) =>
        `SKU ${sku} · ${barcode}`,
      productAccessibilityLabel: (
        brand: string,
        name: string,
        sku: string,
        picked: number,
        required: number,
        verified: boolean,
      ) =>
        `${brand} ${name}, SKU ${sku}, picked ${picked} of ${required}, ${verified ? "verified" : "still to scan"}`,
      allUnitsVerified: "All units verified.",
      scanMoreUnits: (remaining: number) =>
        `Scan ${remaining} more ${plural(remaining, "unit")} to mark this order ready`,
      cancel: {
        title: (number: string) => `Cancel order #ORD-${number}?`,
        message:
          "The customer's order is cancelled and removed from the picking queue. This cannot be undone.",
        confirmLabel: "Cancel order",
        cancelLabel: "Keep order",
        doneAnnouncement: (number: string) => `Order ${number} cancelled`,
      },
      footer: {
        startPicking: "Start picking",
        startPickingHint: "Moves this order into picking",
        markReady: "Mark ready",
        markReadyHint: "Opens the completion check for this order",
        scanProduct: "Scan product",
        scanProductHint: "Opens the barcode scanner to verify products",
        typeCode: "Type code",
        typeCodeHint: "Enter a barcode by hand",
        readyBanner:
          "Ready for collection. Hand-over flow arrives in a later milestone.",
        collectedBanner: "This order has been collected.",
        cancelledBanner: "This order was cancelled.",
      },
    },

    scanner: {
      title: (orderNumber: string) => `Scan ${orderNumber}`,
      titleFallback: "Scan products",
      notFoundMessage: "Open an order and start picking before scanning.",
      notStarted: "Start picking this order before scanning products.",
      closed: "This order is no longer being picked, so scanning is closed.",
      verified: (name: string, picked: number, required: number) =>
        `Verified ${name}. ${picked} of ${required} picked.`,
      progress: (verified: number, total: number) =>
        `${verified} of ${total} ${plural(total, "item")} verified`,
      allVerified: "All items verified. Review the order and mark it ready.",
      reviewAndComplete: "Review and complete",
      stillToPick: "Still to pick",
      remainingQuantity: (remaining: number) => `×${remaining}`,
      remainingAccessibilityLabel: (
        name: string,
        remaining: number,
        barcode: string,
      ) => `${name}, ${remaining} still to pick, barcode ${barcode}`,
    },

    completion: {
      title: "Order Completion",
      notFoundMessage: (id: string) => `We couldn't find order ${id}.`,
      readyTitle: "Ready for collection",
      confirmTitle: "Confirm order is ready",
      readySubtitle: (orderNumber: string) =>
        `${orderNumber} can be handed to the customer.`,
      confirmSubtitle: "Check every product is bagged before confirming.",
      readyAnnouncement: (orderNumber: string) =>
        `${orderNumber} is ready for collection.`,
      summaryAccessibilityLabel: (label: string, value: string) =>
        `${label}: ${value}`,
      customer: "Customer",
      verifiedProducts: "Verified products",
      unitsPicked: "Units picked",
      finalStatus: "Final status",
      ratio: (done: number, total: number) => `${done} of ${total}`,
      finalReady: "Ready",
      finalPending: "Picking (not yet confirmed)",
      cannotMarkReady: (reason: string) =>
        `This order can't be marked ready yet. ${reason}`,
      confirmReady: "Confirm ready for collection",
      confirmReadyHint: "Moves the order to Ready",
    },

    picking: {
      invalidBarcode: "Enter a valid barcode of 8 to 14 digits.",
      orderNotPicking: "Start picking this order before scanning products.",
      notInOrder: (barcode: string) =>
        `Wrong product. Barcode ${barcode} is not part of this order.`,
      alreadyPicked: (name: string, picked: number, required: number) =>
        `${name} is already fully picked (${picked}/${required}). Put the extra unit back.`,
    },

    stateMachine: {
      invalidStatus: (status: string) =>
        `Only orders in Picking can be marked ready. This order is ${status}.`,
      noItems: "This order has no items to verify.",
      invalidQuantity:
        "Every item must have a required quantity greater than zero.",
      itemsNotVerified: (remaining: number) =>
        `${remaining} ${plural(remaining, "item")} still to verify.`,
      transitionNotAllowed: (from: string, to: string) =>
        `Cannot move an order from ${from} to ${to}.`,
    },

    assignment: {
      notReassignable: "Only New and Picking orders can be reassigned.",
    },

    store: {
      orderNotFound: "Order not found.",
      genericError: "Something went wrong. Please try again.",
    },
  };

  export const roster = {
    roster: {
      addShift: "Add shift",
      addShiftPastDay:
        "Past days are read-only. Existing shifts can still be edited.",
      dayTotals: (staff: number, hours: string) => `${staff} staff · ${hours}`,
      eyebrow: "Team",
      floorCoverTitle: (day: string) => `Floor cover · ${day}`,
      nextWeek: "Next week",
      noShiftsMessage: (day: string) => `Nobody is rostered on ${day}.`,
      noShiftsTitle: "No shifts",
      loadErrorMessage: "Check your connection and try again.",
      loadErrorTitle: "Couldn't load the roster",
      loading: "Loading the roster…",
      previousWeek: "Previous week",
      returnToThisWeekHint: "Returns to this week",
      thisWeek: "This week",
      title: "Roster",
      weekOf: (range: string, isCurrentWeek: boolean) =>
        `Week of ${range}${isCurrentWeek ? ", this week" : ""}`,
      weekTotal: (hours: string) =>
        `${hours} scheduled this week. Hours only. Pay rates are visible to managers.`,
    },
    rosterRow: {
      breakMinutes: (minutes: number) => `${minutes}m break`,
      noBreak: "No break",
      overnightEnds: (day: string) => `overnight, ends ${day}`,
      unknownEmployee: "Unknown employee",
    },
    weekDaySelector: {
      day: (day: string, isToday: boolean) =>
        `${day}${isToday ? ", today" : ""}`,
      label: "Choose a day",
    },
    weekNavigator: {
      backToThisWeek: "Back to this week",
      nextWeek: "Next week",
      previousWeek: "Previous week",
    },
    floorCover: {
      allDayNote: (minimum: number) =>
        `At least ${minimum} on the floor all day`,
      belowMinimumNote: (minimum: number, hours: string) =>
        `Below minimum of ${minimum} at ${hours}`,
      addCover: (hour: string) => `Add cover at ${hour}`,
      addCoverHint: "Opens Add shift starting at this hour",
      hourLabel: (hour: string, count: number) =>
        `${hour}, ${count} ${count === 1 ? "person" : "people"} on the floor`,
      hourLabelLow: (hour: string, count: number, minimum: number) =>
        `${hour}, ${count} ${count === 1 ? "person" : "people"}, below the minimum of ${minimum}. Add a shift starting ${hour}`,
    },
    shiftEditor: {
      addShift: "Add shift",
      addTitle: "Add Shift",
      backToRoster: "Back to roster",
      dateLabel: "Date",
      dateFixedHint: "Set by the day you chose on the roster",
      editTitle: "Edit Shift",
      employeeLabel: "Employee",
      employeePlaceholder: "Choose an employee",
      endsNextDay: "Ends next day",
      endsNextDayHint: "For overnight shifts, such as a stocktake.",
      endsOn: (day: string) => `Ends ${day}`,
      endTimeLabel: "End time",
      fixFields: "Fix the highlighted fields before saving.",
      notFoundMessage: "It may have been removed.",
      notFoundTitle: "Shift not found",
      removeConfirmMessage:
        "The shift is deleted from the roster. This cannot be undone.",
      removeConfirmTitle: "Remove this shift?",
      removeShift: "Remove shift",
      saveChanges: "Save changes",
      shiftAdded: "Shift added",
      shiftDate: "Shift date",
      shiftRemoved: "Shift removed",
      shiftUpdated: "Shift updated",
      startTimeLabel: "Start time",
      summaryHours: (total: string, paid: string) =>
        `${total} shift · ${paid} paid`,
      summaryInvalid: "Choose a valid start and end time.",
      summaryTitle: "Summary",
      unpaidBreakLabel: "Unpaid break",
    },
    shiftForm: {
      breakNegative: "Break cannot be negative.",
      breakOption: (minutes: number) => `${minutes} minutes`,
      breakWholeMinutes: "Break must be whole minutes.",
      chooseDate: "Choose a date.",
      chooseEmployee: "Choose an employee.",
      chooseEndTime: "Choose an end time.",
      chooseStartTime: "Choose a start time.",
      noUnpaidBreak: "No unpaid break",
    },
    validation: {
      alreadyWorks: (name: string, times: string, day: string) =>
        `${name} already works ${times} on ${day}.`,
      breakNotWhole: "Break must be zero or more whole minutes.",
      breakTooLong: "Break cannot be as long as, or longer than, the shift.",
      chooseEmployee: "Choose an employee.",
      employeeInactive: (name: string) =>
        `${name} is inactive and cannot be rostered.`,
      employeeMissing: "This employee does not exist.",
      employeeNotAssigned: (name: string) =>
        `${name} is not assigned to this store.`,
      endBeforeStart:
        'End time must be after the start time. Turn on "Ends next day" for an overnight shift.',
      invalidEndTime: "Enter a valid end time.",
      invalidStartTime: "Enter a valid start time.",
      shiftMissing: "This shift no longer exists.",
      startsInPast: "That start time has already passed. Choose a later time.",
      tooLong: (hours: number) =>
        `Shifts cannot be longer than ${hours} hours. Check the end time and "Ends next day".`,
    },
    cover: {
      breakNeedsCover: (time: string) => `Break at ${time} · needs cover`,
      finished: "Finished",
      onBreakUntil: (time: string) => `On break until ${time}`,
      onTheFloor: "On the floor",
      onTheFloorYou: "On the floor (you)",
      starts: (time: string) => `Starts ${time}`,
    },
  };

  export const settings = {
    screen: {
      title: "Settings",
      rowLabel: (label: string, value: string) => `${label}: ${value}`,
    },
    profile: {
      accessibilityLabel: (name: string, role: string, staffId: string) =>
        `${name}, ${role}, staff ID ${staffId}`,
      summary: (role: string, staffId: string) => `${role} · ${staffId}`,
    },
    store: {
      title: "Assigned store",
      store: "Store",
      storeId: "Store ID",
      tradingHours: "Trading hours",
    },
    preferences: {
      title: "App preferences",
      vibrate: {
        label: "Vibrate on scan errors",
        description:
          "A short vibration when a barcode is wrong or already picked",
      },
    },
    notifications: {
      title: "Notifications",
      newOrders: {
        label: "New Click & Collect orders",
        description: "When a customer places an order",
      },
      lowStock: {
        label: "Low stock alerts",
        description: "When a product reaches its reorder point",
      },
      rosterChanges: {
        label: "Roster changes",
        description: "When your shifts are added or changed",
      },
    },
    about: {
      title: "About",
      appVersion: "App version",
      platform: "Platform",
      platformValue: (sdkMajor: string) => `Expo SDK ${sdkMajor}`,
    },
    reset: {
      label: "Reset demo data",
      hint: "Restores orders and the roster to their original demo state",
      confirmTitle: "Reset demo data?",
      confirmLabel: "Reset data",
      confirmMessage:
        "All order progress and roster changes will be lost, including changes waiting to sync.",
      done: "Demo orders and roster restored.",
    },
    developer: {
      title: "Developer",
      note: "Simulated network conditions for demos. Only shown in development builds.",
      forceOffline: {
        label: "Force offline",
        description: "Act as if there is no connection",
      },
      slowNetwork: {
        label: "Slow network",
        description: "Add a few seconds to every request",
      },
      failRequests: {
        label: "Fail every request",
        description:
          "Every request fails with a server error until you turn this off",
      },
    },
    signOut: {
      label: "Sign out",
      hint: "Clears data saved on this device and returns to sign-in",
      confirmTitle: "Sign out?",
      confirmLabel: "Sign out",
      confirmMessage:
        "This is a demo account, so signing out clears the orders, roster changes and preferences saved on this device.",
      announcement: "Signed out. Demo data cleared.",
    },
  };
}
