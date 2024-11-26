const moment = require('moment');

function formatDate(input) {
  const date = moment(input);

  if (date.isSame(moment(), 'day')) {
    // Format as time in "h:mm A" format if it's today
    return date.format('h:mm A');
  } else if (date.isSame(moment().subtract(1, 'days'), 'day')) {
    // Return "Yesterday" if it's yesterday
    return 'Yesterday';
  } else {
    // Format as "DD-MM-YYYY" for any other day
    return date.format('DD-MM-YYYY');
  }
}
function formatDateForComments(date) {
  const now = moment();
  const givenDate = moment(date);

  // Check if the date is today
  if (now.isSame(givenDate, 'day')) {
      // Display in hours ago if it's today
      return `${now.diff(givenDate, 'hours')} h`;
  } else {
      // Display in days ago otherwise
      return `${now.diff(givenDate, 'days')} d`;
  }
}

module.exports = {
  formatDate,
  formatDateForComments
}
