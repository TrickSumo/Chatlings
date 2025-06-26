import React, { useEffect, useRef, useState } from 'react';
import { WSS_API_BASE_URL, getAccessToken } from '../utils/utils';

console.log(`WebSocket URL: ${WSS_API_BASE_URL}?Authorization=${getAccessToken()}`);


const Home = () => {

  return (
    <div>
      <h1>Home</h1>

    </div>
  );
};

export default Home;
