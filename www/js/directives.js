angular.module('okarito.directives', ['ionic'])

.directive('fancySelect', [
  '$ionicModal',
  function($ionicModal) {
    var originalValue = '';

    return {
      restrict: 'E',
      replace: true,
      templateUrl: function(elem, attrs) {
        if (attrs.mode && attrs.mode == 'icon') {
          return 'templates/icon-select.html';
        } else {
          return 'templates/fancy-select.html';
        }
      },
      scope: {
        'items': '=?',
        'label': '@label',
        'text': '=?',
        'value': '=?',
        'callback': '&'
      },

      link: function(scope, element, attrs) {
        scope.allowEmpty = attrs.allowEmpty === 'false' ? false : true;
        scope.headerText = attrs.headerText || '';
        scope.defaultText = scope.text || '';
        scope.label = attrs.label || '';

        /* Notes in the right side of the label */
        scope.noteText = attrs.noteText || '';
        scope.noteImg = attrs.noteImg || '';
        scope.noteImgClass = attrs.noteImgClass || '';

        $ionicModal.fromTemplateUrl(
          'templates/fancy-select-items.html', {
            'scope': scope
          }
        ).then(function(modal) {
          scope.modal = modal;
        });

        scope.showItems = function(event) {
          event.preventDefault();
          scope.modal.show();
        }

        scope.hideItems = function() {
          scope.modal.hide();
        }

        scope.$on('$destroy', function() {
          scope.modal.remove();
        });

        scope.validateSingle = function(item) {
          scope.text = item.text;
          scope.value = item.id;
          scope.hideItems();

          // Execute callback function
          if (typeof scope.callback == 'function') {
            scope.callback({ val: scope.value, text: scope.text });
          }
        }
      }
    };
  }
]);
