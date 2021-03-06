function showNotifications() {
  $('#notifications').removeClass('display_none');
  $('#notifications').addClass('display_block');
}

function emptyNotificationsList() {
  $('#notifications_list').empty();
}

function showNotificationsNone() {
  $('#notifications_none').removeClass('display_none');
  $('#notifications_none').addClass('display_block');
}

function hideNotificationsNone() {
  $('#notifications_none').removeClass('display_block');
  $('#notifications_none').addClass('display_none');
}

function changeTitle(count) {
  var title = document.title;
  var eliminate = title.substr(0, title.indexOf(') ')) + ')';
  title = title.replace(eliminate, '');
  var newTitle = '(' + count + ') ' + title;

  if (count === 0) {
    newTitle = title;
  }

  document.title = newTitle;
}

function renderNotifications(notifications) {
  changeTitle(notifications.length);
  emptyNotificationsList();
  showNotifications();
  hideNotificationsNone();

  _.each(notifications, function(notification) {
    var notificationLink = new NotificationRenderer(notification).render();
    $('#notifications_list').prepend(notificationLink);
  });
}

function fetchNotifications() {
  $.ajax({
    dataType: "text",
    url: "/notifications/fetch_notifications",
    type: "GET",
    success: function (json) {
      var data = JSON.parse(json).fetch_notifications;
      if (data.length > 0) {
        renderNotifications(data);
      } else {
        changeTitle(data.length);
        emptyNotificationsList();
        showNotificationsNone();
      }
    }
  });
}

function showBackdrop() {
  $('body').addClass('show_backdrop');
}

function hideBackdrop() {
  $('body').removeClass('show_backdrop');
}

function showCategoriesMoods() {
  $('#categories_moods').removeClass('display_none');
  $('#categories_moods').addClass('display_block');
  showBackdrop();
}

function hideCategoriesMoods() {
  $('#categories_moods').removeClass('display_block');
  $('#categories_moods').addClass('display_none');
  hideBackdrop();
}

function hideTipNotifications() {
  $(this).closest('.tip_notifications').toggleClass("display_none");
  hideBackdrop();
}

function quickCreate(form, data_type) {
  var values = $(form).serialize();
  $.ajax({
      type: 'POST',
      url: $(form).attr('action'),
      data: values,
      dataType: 'json'
  }).success(function(json) {
      // Update moments/strategies form
      if (data_type === 'category') {
        $('#categories_list').prepend(json.label);
        $('#categories_list').prepend(json.checkbox);
      } else if (data_type === 'mood') {
        $('#moods_list').prepend(json.label);
        $('#moods_list').prepend(json.checkbox);
      } else if (data_type === 'strategy') {
        $('#strategies_list').prepend(json.label);
        $('#strategies_list').prepend(json.checkbox);
      }

      // Checking the newly added checkbox.
      var id = $(json.checkbox).attr('id');
      $('#' + id).prop('checked', true);

      $(form).trigger('reset');
      $('.quick_create_close').click();
  });
}

function closeQuickCreate() {
  var quickCreateId = $(this).closest('.quick_create').attr('id');
  if (quickCreateId === 'category_quick_create' || quickCreateId === 'mood_quick_create' || quickCreateId === 'strategy_quick_create') {
    if (!$('#' + quickCreateId).hasClass('display_none')) {
      $('#' + quickCreateId).toggleClass('display_none');
    }
  }
  hideBackdrop();
}

var onReadyNotifications = function() {
  /* Pusher */
  var pusher;

  $.ajax({
    dataType: "json",
    url: "/notifications/signed_in",
    type: "GET",
    success: function(json) {
      if (json !== undefined) {
        var result = json.signed_in;

        if (result !== -1) {
          // Show notifications on initial sign in
          if ($('body').hasClass('pages home')) {
            fetchNotifications();
          }

          var pusherKey = $('meta[name="pusher-key"]').attr('content');
          pusher = new Pusher(pusherKey, {
            encrypted: true
          });

          var channel = pusher.subscribe('private-' + result);
          channel.bind('new_notification', function(data) {
            renderNotifications(data.notifications);
          });
        }
      }
    }
  });

  $('.notifications_button').click(function(event) {
    event.preventDefault();
    $('#notifications').addClass('display_block');
    $('#notifications').removeClass('display_none');
    $('.notifications_button').addClass('fade');
    showBackdrop();
    fetchNotifications();
  });

  $('#close_notifications').click(function() {
    $('#notifications').removeClass('display_block');
    $('#notifications').addClass('display_none');
    $('.notifications_button').removeClass('fade');
    hideBackdrop();
  });

   $('#clear_notifications').click(function() {
    emptyNotificationsList();
    showNotificationsNone();
    changeTitle(0);

    $.ajax({
      url: '/notifications/clear',
      type: 'DELETE'
    });

    $('#notifications #clear_notifications').hide();
  });

  /* Quick Moment */
  $('#toggle_categories_moods').click(function() {
    if ($('#categories_moods')[0].classList.contains('display_none')) {
      showCategoriesMoods();
    } else {
      hideCategoriesMoods();
    }
  });

  $('#close_categories_moods').click(function() {
    hideCategoriesMoods();
  });

  $('#categories_moods').click(function() {
    hideCategoriesMoods();
  });

  $('#categories_moods_text').click(function(event) {
    event.stopPropagation();
  });

  /* Tips */
  $('.tip_notifications_button').click(function() {
    $(this).siblings('.tip_notifications').toggleClass("display_none");
    showBackdrop();
  });

  $('.tip_close_notifications').click(function() {
    hideTipNotifications.call(this);
  });

  $('.tip_notifications').click(function() {
    hideTipNotifications.call(this);
  });

  $('.tip_notifications_text').click(function(event) {
    event.stopPropagation();
  });

  /* Quick Create */
  $('#category_quick_button').click(function() {
    $('#category_quick_create').toggleClass("display_none");
    showBackdrop();
  });

  $('#mood_quick_button').click(function() {
    $('#mood_quick_create').toggleClass("display_none");
    showBackdrop();
  });

  $('#strategy_quick_button').click(function() {
    $('#strategy_quick_create').toggleClass("display_none");
    showBackdrop();
  });

  $('.quick_create_close').click(function() {
    closeQuickCreate.call(this);
  });

  $('.quick_create').click(function() {
    closeQuickCreate.call(this);
  });

  $('.quick_create_text').click(function(event) {
    event.stopPropagation();
   });

  if (newOrEdit(['moments', 'strategies'])) {
    $('#new_category').submit(function() {
      quickCreate(this, 'category');
      return false;
    });
  }

  if (newOrEdit(['moments'])) {
    $('#new_mood').submit(function() {
      quickCreate(this, 'mood');
      return false;
    });

    $('#new_strategy').submit(function() {
      quickCreate(this, 'strategy');
      return false;
    });
  }

  /* Handle Esc Key */
  $(document).keyup(function(event) {
    if (event.keyCode === 27) {
      if (!$('#categories_moods').hasClass('display_none')) {
        hideCategoriesMoods();
      }
      closeQuickCreate.call($('.quick_create:not(.display_none)'));
      hideTipNotifications.call($('.tip_notifications:not(.display_none)'));
    }
  });
};

$(document).on("page:load ready", onReadyNotifications);
