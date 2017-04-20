import PropTypes from 'prop-types';
import React, { Component } from 'react';
import cx from 'classnames';

export default class TabPanel extends Component {

  static defaultProps = {
    activeClassName: 'ReactTabs__TabPanel--selected',
    className: 'ReactTabs__TabPanel',
    forceRender: false,
    style: {},
  };

  static propTypes = {
    activeClassName: PropTypes.string, // private
    children: PropTypes.node,
    className: PropTypes.oneOfType([PropTypes.string, PropTypes.array, PropTypes.object]),
    forceRender: PropTypes.bool,
    id: PropTypes.string, // private
    selected: PropTypes.bool, // private
    style: PropTypes.object,
    tabId: PropTypes.string, // private
  };

  render() {
    const {
      activeClassName,
      children,
      className,
      forceRender,
      id,
      selected,
      style,
      tabId,
      ...attributes } = this.props;

    return (
      <div
        {...attributes}
        className={cx(
          className,
          {
            [activeClassName]: selected,
          },
        )}
        role="tabpanel"
        id={id}
        aria-labelledby={tabId}
      >
        {(forceRender || selected) ? children : null}
      </div>
    );
  }
}
