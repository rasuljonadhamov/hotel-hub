sap.ui.define([
    "sap/fe/test/JourneyRunner",
	"hotel/booking/bookings/test/integration/pages/BookingsList.gen",
	"hotel/booking/bookings/test/integration/pages/BookingsObjectPage.gen"
], function (JourneyRunner, BookingsListGenerated, BookingsObjectPageGenerated) {
    'use strict';

    const runner = new JourneyRunner({
        launchUrl: sap.ui.require.toUrl('hotel/booking/bookings') + '/test/flp.html#app-preview',
        pages: {
			onTheBookingsListGenerated: BookingsListGenerated,
			onTheBookingsObjectPageGenerated: BookingsObjectPageGenerated
        },
        async: true
    });

    return runner;
});

