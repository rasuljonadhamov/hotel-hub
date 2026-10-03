sap.ui.define([
    "sap/fe/test/JourneyRunner",
	"hotelbooking/test/integration/pages/BookingsList.gen",
	"hotelbooking/test/integration/pages/BookingsObjectPage.gen"
], function (JourneyRunner, BookingsListGenerated, BookingsObjectPageGenerated) {
    'use strict';

    const runner = new JourneyRunner({
        launchUrl: sap.ui.require.toUrl('hotelbooking') + '/test/flp.html#app-preview',
        pages: {
			onTheBookingsListGenerated: BookingsListGenerated,
			onTheBookingsObjectPageGenerated: BookingsObjectPageGenerated
        },
        async: true
    });

    return runner;
});

