import React from 'react';
import ReactDOM from 'react-dom';
import './popu.css'; // Import CSS

const Popup = () => {
  return React.createElement(
    'div',
    null,
    React.createElement('h1', null, 'Bookmark Extension'),
    React.createElement(
      'button',
      { onClick: () => alert('Bookmark Saved!') },
      'Save Bookmark'
    )
  );
};

// Render the component into the root element
ReactDOM.render(
  React.createElement(Popup),
  document.getElementById('root')
);
