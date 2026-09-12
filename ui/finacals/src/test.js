import React, { useCallback } from "react";

export const Child = React.memo(({ onClick }) => {
  console.log("render");
  return <button onClick={onClick}>Click Memo</button>;
});

export default function Parent() {
    
  const handleClick = useCallback(() => {
    console.log("click callback");
  }, []);
  return <Child onClick={handleClick} />;
}
