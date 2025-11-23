import React from 'react';

const Header = ({ title, subtitle, action }) => (
  <header className="flex justify-between gap-4 flex-wrap items-start mb-0">
    <div>
      <h1 className="text-2xl font-bold m-0 text-text-primary font-display tracking-tight bg-gradient-to-br from-text-primary to-text-secondary bg-clip-text text-transparent">
        {title}
      </h1>
      {subtitle ? (
        <p className="text-text-secondary text-sm m-0 mt-1">{subtitle}</p>
      ) : null}
    </div>
    {action ? <div>{action}</div> : null}
  </header>
);

export default Header;
