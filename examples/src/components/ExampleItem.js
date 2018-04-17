import React, { Component } from 'react';
import T from 'prop-types';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs'; // eslint-disable-line
import classNames from 'classnames';

let ReactLive;

const scope = { Tabs, Tab, TabList, TabPanel };

export default class ExampleItem extends Component {
  state = {
    editorOpen: false,
    liveLoaded: false,
  };

  constructor(props) {
    super(props);

    import('react-live').then(Live => {
      ReactLive = Live;
      this.setState({ liveLoaded: true });
    });
  }

  toggleCheckbox({ target: { name, checked } }) {
    this.setState({
      [name]: checked,
    });
  }

  handleEditSourceClick = () => {
    this.setState({
      editorOpen: !this.state.editorOpen,
    });
  };

  renderHint() {
    if (!this.props.hint) return null;

    return <div className="hint">{this.props.hint}</div>;
  }

  renderLiveEditor() {
    if (!this.state.liveLoaded) return null;

    const { editorOpen } = this.state;
    const editorClassNames = classNames('live-editor', {
      'live-editor--visible': editorOpen,
    });

    return (
      <ReactLive.LiveProvider
        mountStylesheet={false}
        scope={scope}
        code={this.props.code}
        noInline
      >
        <ReactLive.LiveError />
        <div className="live-preview">
          <div className={editorClassNames}>
            <ReactLive.LiveEditor ignoreTabKey />
          </div>
          <ReactLive.LivePreview />
        </div>
      </ReactLive.LiveProvider>
    );
  }

  render() {
    const { editorOpen } = this.state;
    const formId = `editorOpen${this.props.label.replace(' ', '_')}`;

    return (
      <div className="section">
        <h3 className="section__heading">
          {this.props.label}{' '}
          <label className="source-checkbox-label" htmlFor={formId}>
            <input
              type="checkbox"
              id={formId}
              name={formId}
              checked={editorOpen}
              onClick={this.handleEditSourceClick}
            />
            View source
          </label>
        </h3>
        {this.renderHint()}
        {this.renderLiveEditor()}
      </div>
    );
  }
}

ExampleItem.propTypes = {
  label: T.string.isRequired,
  hint: T.string.isRequired,
  code: T.string.isRequired,
};
