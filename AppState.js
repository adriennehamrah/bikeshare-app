import React from 'react';

export default class AppState extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      text: 'Bikeshare App'
    };

    // this.setAppState = this.setAppState.bind(this);
  }

setAppState(newState, cb) {
  this.setState(newState, cb);
}

render() {
  return(
    <View>
      {React.children.map(this.props.children, child => {
        return React.cloneElement(child, {
          appState: this.state,
          setAppState: this.setAppState
        });
      })}
    </View>
    );
  }
}
