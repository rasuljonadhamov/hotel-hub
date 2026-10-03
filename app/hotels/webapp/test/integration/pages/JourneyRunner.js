sap.ui.define([
    "sap/fe/test/JourneyRunner",
	"hotel/booking/hotels/test/integration/pages/HotelsList.gen",
	"hotel/booking/hotels/test/integration/pages/HotelsObjectPage.gen",
	"hotel/booking/hotels/test/integration/pages/RoomsObjectPage.gen"
], function (JourneyRunner, HotelsListGenerated, HotelsObjectPageGenerated, RoomsObjectPageGenerated) {
    'use strict';

    const runner = new JourneyRunner({
        launchUrl: sap.ui.require.toUrl('hotel/booking/hotels') + '/test/flp.html#app-preview',
        pages: {
			onTheHotelsListGenerated: HotelsListGenerated,
			onTheHotelsObjectPageGenerated: HotelsObjectPageGenerated,
			onTheRoomsObjectPageGenerated: RoomsObjectPageGenerated
        },
        async: true
    });

    return runner;
});

