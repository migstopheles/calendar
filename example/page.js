// this is how you make it happen (adding '.widgets[0]' because I know it'll only match 1 calendar - 
// this could be part of an array of calendars if the selector matches multiple elements)
var cal1 = new PageCalendars('.cal-1', {
	panes: 3,
	interval: 1
}).widgets[0];

var cal2 = new PageCalendars('.cal-2').widgets[0];

// return an array of primes within a limit (just an example of day higlighting)
var getPrimes = function(max) {
	var list = [],
	primes = [1],
	base = 2,
	idx = base,
	l = 0;
	for( var i = 2; i < max; i ++ ) {
		if ( i % base === 0 && i > base) continue;
	    list.push(i);
	}
	l = list.length;
	while ( base < max ) {
		l = list.length;
		base = list[0]
	    for( var i = 0; i < l; i ++ ) {
	        if ( list[i] % base === 0 && list[i] !== base ) {
	            list.splice(i,1); i = i-1;
	        }
	    }
	    primes[primes.length] = list.splice(0,1)[0];
	}
	return primes;
};
// highlight prime-number days whenever month changes
var monthChangeEvent = function() {
	var pi = this.panes.length;
	while ( pi-- ) {
		var pane = this.panes[pi];
		var curmonth = this.calendar_info[pane.current_month + pane.current_year];
		var highlights = getPrimes(curmonth.data.length);
		for ( var i = 0, l = highlights.length; i < l; i++ ) {
			var day = this.getDay(pane.current_year,pane.current_monthNum,highlights[i]);
			if ( day ) {
				day.dom_node.className += ' highlighted';
			};
		}
	}
};
cal1.onMonthChanged = monthChangeEvent
cal2.onMonthChanged = monthChangeEvent

// loop through and highlight the next 7 days
cal1.onDaySelected = cal2.onDaySelected = function(day) {
	this.onDayUnSelected();
	var i = day.date_information.dayofmonth - 1;
	var year = day.date_information.raw_date.getFullYear();
	var month = day.date_information.raw_date.getMonth();
	while( i++ <  day.date_information.dayofmonth + 6) {
		var highlightday = this.getDay(year, month, i);
		highlightday.select();
	}
};
// loop through and unhighlight days
cal1.onDayUnSelected = cal2.onDayUnSelected = function(day) {
	var i = this.selected_dates.length;
	while( i--) {
		this.selected_dates[i].unSelect();
	}
};
cal1.onMonthChanged();
cal2.onMonthChanged();