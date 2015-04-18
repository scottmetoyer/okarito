angular.module('okarito.directives', ['ionic'])

.directive('fancySelect', [
  '$ionicModal',
  function($ionicModal) {
    return {
      restrict: 'E',
      templateUrl: 'templates/fancy-select.html',
      scope: {
        'items': '=',
        'text': '=',
        'value': '=',
        'callback': '&'
      },

      link: function(scope, element, attrs) {

        scope.allowEmpty = attrs.allowEmpty === 'false' ? false : true;
        scope.headerText = attrs.headerText || '';
        scope.defaultText = scope.text || '';

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

        /* Validate selection from header bar */
        scope.validate = function(event) {
          // Select first value if not nullable
          if (typeof scope.value == 'undefined' || scope.value == '' || scope.value == null) {
            if (scope.allowEmpty == false) {
              scope.value = scope.items[0].id;
              scope.text = scope.items[0].text;
            } else {
              scope.text = scope.defaultText;
            }
          }

          scope.hideItems();

          if (typeof scope.callback == 'function') {
            scope.callback(scope.value);
          }
        }

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
            scope.callback(scope.value);
          }
        }
      }
    };
  }
]);
