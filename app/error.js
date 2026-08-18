'use client';

import {useEffect} from 'react';

export default function Error({error,reset}){
  useEffect(()=>{console.error(error)},[error]);
  return <main style={{minHeight:'60vh',display:'grid',placeItems:'center',padding:32,textAlign:'center'}}>
    <div><h1>Something went wrong.</h1><p>Please try again.</p><button className="btn" onClick={()=>reset()}>Try again</button> <a className="btn" href="/">Home</a></div>
  </main>;
}
