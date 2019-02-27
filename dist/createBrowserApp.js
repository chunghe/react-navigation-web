'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = createBrowserApp;

var _history = require('history');

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _core = require('@react-navigation/core');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/* eslint-disable import/no-commonjs */
const queryString = require('query-string'); /* eslint-env browser */

const history = (0, _history.createBrowserHistory)();

const getPathAndParamsFromLocation = location => {
  const path = encodeURI(location.pathname.substr(1));
  const params = queryString.parse(location.search);
  return { path, params };
};

const matchPathAndParams = (a, b) => {
  if (a.path !== b.path) {
    return false;
  }
  if (queryString.stringify(a.params) !== queryString.stringify(b.params)) {
    return false;
  }
  return true;
};

let currentPathAndParams = getPathAndParamsFromLocation(history.location);

function createBrowserApp(App) {
  const initAction = App.router.getActionForPathAndParams(currentPathAndParams.path, currentPathAndParams.params) || _core.NavigationActions.init();

  const setHistoryListener = dispatch => {
    history.listen(location => {
      const pathAndParams = getPathAndParamsFromLocation(location);
      if (matchPathAndParams(pathAndParams, currentPathAndParams)) {
        return;
      }
      currentPathAndParams = pathAndParams;
      const action = App.router.getActionForPathAndParams(pathAndParams.path, pathAndParams.params);
      if (action) {
        dispatch(action);
      } else {
        dispatch(initAction);
      }
    });
  };

  class WebApp extends _react2.default.Component {
    constructor(...args) {
      var _temp;

      return _temp = super(...args), this.state = { nav: App.router.getStateForAction(initAction) }, this._title = document.title, this._actionEventSubscribers = new Set(), this._dispatch = action => {
        const lastState = this.state.nav;
        const onNavigationStateChange = this.props.onNavigationStateChange;
        const newState = App.router.getStateForAction(action, lastState);
        const dispatchEvents = () => this._actionEventSubscribers.forEach(subscriber => subscriber({
          type: 'action',
          action,
          state: newState,
          lastState
        }));
        if (newState && newState !== lastState) {
          this.setState({ nav: newState }, dispatchEvents);
          const pathAndParams = App.router.getPathAndParamsForState && App.router.getPathAndParamsForState(newState);
          if (pathAndParams && !matchPathAndParams(pathAndParams, currentPathAndParams)) {
            currentPathAndParams = pathAndParams;
            if (onNavigationStateChange) {
              onNavigationStateChange(lastState, newState, action);
            }
            history.push(`/${pathAndParams.path}?${queryString.stringify(pathAndParams.params)}`);
          }
        } else {
          dispatchEvents();
        }
      }, _temp;
    }

    componentDidMount() {
      setHistoryListener(this._dispatch);
      this.updateTitle();
      this._actionEventSubscribers.forEach(subscriber => subscriber({
        type: 'action',
        action: initAction,
        state: this.state.nav,
        lastState: null
      }));
    }
    componentDidUpdate() {
      this.updateTitle();
    }
    updateTitle() {
      const { state } = this._navigation;
      const childKey = state.routes[state.index].key;
      const activeNav = this._navigation.getChildNavigation(childKey);
      const opts = App.router.getScreenOptions(activeNav);
      this._title = opts.title || opts.headerTitle;
      if (this._title) {
        document.title = this._title;
      }
    }
    render() {
      this._navigation = (0, _core.getNavigation)(App.router, this.state.nav, this._dispatch, this._actionEventSubscribers, () => this.props.screenProps, () => this._navigation);
      return _react2.default.createElement(
        _core.NavigationProvider,
        { value: this._navigation },
        _react2.default.createElement(App, { navigation: this._navigation })
      );
    }
  }
  return WebApp;
}