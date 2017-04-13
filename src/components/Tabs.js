import PropTypes from 'prop-types';
import React, { cloneElement, Component } from 'react';
import cx from 'classnames';
import uuid, { reset } from '../helpers/uuid';
import childrenPropType from '../helpers/childrenPropType';
import Tab from './Tab';

// Determine if a node from event.target is a Tab element
function isTabNode(node) {
  return node.nodeName === 'LI' && node.getAttribute('role') === 'tab';
}

// Determine if a tab node is disabled
function isTabDisabled(node) {
  return node.getAttribute('aria-disabled') === 'true';
}

export default class Tabs extends Component {

  static childContextTypes = {
    forceRenderTabPanel: PropTypes.bool,
  };

  static defaultProps = {
    focus: false,
    forceRenderTabPanel: false,
    selectedIndex: -1,
  };

  static propTypes = {
    children: childrenPropType,
    className: PropTypes.string,
    focus: PropTypes.bool, // eslint-disable-line react/no-unused-prop-types
    forceRenderTabPanel: PropTypes.bool,
    onSelect: PropTypes.func,
    selectedIndex: PropTypes.number, // eslint-disable-line react/no-unused-prop-types
  };

  tabNodes = [];

  constructor(props) {
    super(props);
    this.state = Tabs.copyPropsToState(this.props, this.state);
  }

  static resetIDCounter() {
    reset();
  }

  getChildContext() {
    return {
      forceRenderTabPanel: this.props.forceRenderTabPanel,
    };
  }

  componentWillReceiveProps(newProps) {
    // Use a transactional update to prevent race conditions
    // when reading the state in copyPropsToState
    // See https://github.com/reactjs/react-tabs/issues/51
    this.setState(state => Tabs.copyPropsToState(newProps, state));
  }

  setSelected(index, focus) {
    // Don't do anything if nothing has changed
    if (index === this.state.selectedIndex) return;
    // Check index boundary
    if (index < 0 || index >= this.getTabsCount()) return;

    // Keep reference to last index for event handler
    const last = this.state.selectedIndex;

    // Check if the change event handler cancels the tab change
    let cancel = false;

    // Call change event handler
    if (typeof this.props.onSelect === 'function') {
      cancel = this.props.onSelect(index, last) === false;
    }

    if (!cancel) {
      // Update selected index
      this.setState({ selectedIndex: index, focus: focus === true });
    }
  }

  getNextTab(index) {
    const count = this.getTabsCount();

    // Look for non-disabled tab from index to the last tab on the right
    for (let i = index + 1; i < count; i++) {
      if (!isTabDisabled(this.getTab(i))) {
        return i;
      }
    }

    // If no tab found, continue searching from first on left to index
    for (let i = 0; i < index; i++) {
      if (!isTabDisabled(this.getTab(i))) {
        return i;
      }
    }

    // No tabs are disabled, return index
    return index;
  }

  getPrevTab(index) {
    let i = index;

    // Look for non-disabled tab from index to first tab on the left
    while (i--) {
      if (!isTabDisabled(this.getTab(i))) {
        return i;
      }
    }

    // If no tab found, continue searching from last tab on right to index
    i = this.getTabsCount();
    while (i-- > index) {
      if (!isTabDisabled(this.getTab(i))) {
        return i;
      }
    }

    // No tabs are disabled, return index
    return index;
  }

  getTabsCount() {
    return this.props.children && this.props.children[0] ?
            React.Children.count(this.props.children[0].props.children) :
            0;
  }

  getPanelsCount() {
    return React.Children.count(this.props.children.slice(1));
  }

  getTab(index) {
    return this.tabNodes[`tabs-${index}`];
  }

  getChildren() {
    let index = 0;
    let count = 0;
    const children = this.props.children;
    const state = this.state;
    this.tabIds = this.tabIds || [];
    this.panelIds = this.panelIds || [];
    let diff = this.tabIds.length - this.getTabsCount();

    // Add ids if new tabs have been added
    // Don't bother removing ids, just keep them in case they are added again
    // This is more efficient, and keeps the uuid counter under control
    while (diff++ < 0) {
      this.tabIds.push(uuid());
      this.panelIds.push(uuid());
    }

    // Map children to dynamically setup refs
    return React.Children.map(children, (child) => {
      // null happens when conditionally rendering TabPanel/Tab
      // see https://github.com/reactjs/react-tabs/issues/37
      if (child === null) {
        return null;
      }

      let result = null;

      // Clone TabList and Tab components to have refs
      if (count++ === 0) {
        // TODO try setting the uuid in the "constructor" for `Tab`/`TabPanel`
        result = cloneElement(child, {
          children: React.Children.map(child.props.children, (tab) => {
            // null happens when conditionally rendering TabPanel/Tab
            // see https://github.com/reactjs/react-tabs/issues/37
            if (tab === null) {
              return null;
            }

            const tabRef = (node) => { this.tabNodes[`tabs-${index}`] = node; };
            const id = this.tabIds[index];
            const panelId = this.panelIds[index];
            const selected = state.selectedIndex === index;
            const focus = selected && state.focus;

            index++;

            if (tab.type === Tab) {
              return cloneElement(tab, {
                tabRef,
                id,
                panelId,
                selected,
                focus,
              });
            }

            return tab;
          }),
        });

        // Reset index for panels
        index = 0;
      } else {
        const id = this.panelIds[index];
        const tabId = this.tabIds[index];
        const selected = state.selectedIndex === index;

        index++;

        result = cloneElement(child, {
          id,
          tabId,
          selected,
        });
      }

      return result;
    });
  }

  handleKeyDown = (e) => {
    if (this.isTabFromContainer(e.target)) {
      let index = this.state.selectedIndex;
      let preventDefault = false;

      // Select next tab to the left
      if (e.keyCode === 37 || e.keyCode === 38) {
        index = this.getPrevTab(index);
        preventDefault = true;
      }
      // Select next tab to the right
      /* eslint brace-style:0 */
      else if (e.keyCode === 39 || e.keyCode === 40) {
        index = this.getNextTab(index);
        preventDefault = true;
      }

      // This prevents scrollbars from moving around
      if (preventDefault) {
        e.preventDefault();
      }

      this.setSelected(index, true);
    }
  };

  handleClick = (e) => {
    let node = e.target;
    do { // eslint-disable-line no-cond-assign
      if (this.isTabFromContainer(node)) {
        if (isTabDisabled(node)) {
          return;
        }

        const index = [].slice.call(node.parentNode.children).indexOf(node);
        this.setSelected(index);
        return;
      }
    } while ((node = node.parentNode) !== null);
  };

  // This is an anti-pattern, so sue me
  static copyPropsToState(props, state) {
    let selectedIndex = props.selectedIndex;

    // If no selectedIndex prop was supplied, then try
    // preserving the existing selectedIndex from state.
    // If the state has not selectedIndex, default
    // to the first tab in the TabList.
    //
    // TODO: Need automation testing around this
    // Manual testing can be done using examples/focus
    // See 'should preserve selectedIndex when typing' in specs/Tabs.spec.js
    if (selectedIndex === -1) {
      if (state && state.selectedIndex) {
        selectedIndex = state.selectedIndex;
      } else {
        selectedIndex = 0;
      }
    }

    return {
      selectedIndex,
      focus: props.focus,
    };
  }

  /**
   * Determine if a node from event.target is a Tab element for the current Tabs container.
   * If the clicked element is not a Tab, it returns false.
   * If it finds another Tabs container between the Tab and `this`, it returns false.
   */
  isTabFromContainer(node) {
    // return immediately if the clicked element is not a Tab.
    if (!isTabNode(node)) {
      return false;
    }

    // Check if the first occurrence of a Tabs container is `this` one.
    let nodeAncestor = node.parentElement;
    do {
      if (nodeAncestor === this.node) return true;
      else if (nodeAncestor.getAttribute('data-tabs')) break;

      nodeAncestor = nodeAncestor.parentElement;
    } while (nodeAncestor);

    return false;
  }

  render() {
    // This fixes an issue with focus management.
    //
    // Ultimately, when focus is true, and an input has focus,
    // and any change on that input causes a state change/re-render,
    // focus gets sent back to the active tab, and input loses focus.
    //
    // Since the focus state only needs to be remembered
    // for the current render, we can reset it once the
    // render has happened.
    //
    // Don't use setState, because we don't want to re-render.
    //
    // See https://github.com/reactjs/react-tabs/pull/7
    if (this.state.focus) {
      setTimeout(() => {
        this.state.focus = false;
      }, 0);
    }

    const { className, ...attributes } = this.props;

    // Delete all known props, so they don't get added to DOM
    delete attributes.selectedIndex;
    delete attributes.onSelect;
    delete attributes.focus;
    delete attributes.children;
    delete attributes.forceRenderTabPanel;
    delete attributes.onClick;
    delete attributes.onKeyDown;

    return (
      <div
        {...attributes}
        className={cx(
          'ReactTabs',
          'react-tabs',
          className,
        )}
        onClick={this.handleClick}
        onKeyDown={this.handleKeyDown}
        ref={(node) => { this.node = node; }}
        data-tabs
      >
        {this.getChildren()}
      </div>
    );
  }
}
