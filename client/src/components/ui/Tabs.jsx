import { NavLink } from 'react-router-dom';

export default function Tabs({ tabs, className = '' }) {
  return (
    <div className={`tabs ${className}`} role="tablist">
      {tabs.map((tab) =>
        tab.to !== undefined ? (
          <NavLink
            key={tab.label}
            to={tab.to}
            end={tab.end}
            className={({ isActive }) => `tab ${isActive ? 'is-active' : ''}`}
          >
            {tab.icon ? <tab.icon size={16} /> : null}
            {tab.label}
            {tab.count !== undefined ? <span className="tab-count">{tab.count}</span> : null}
          </NavLink>
        ) : (
          <button
            key={tab.value ?? tab.label}
            type="button"
            role="tab"
            aria-selected={tab.active}
            className={`tab ${tab.active ? 'is-active' : ''}`}
            onClick={tab.onClick}
          >
            {tab.icon ? <tab.icon size={16} /> : null}
            {tab.label}
            {tab.count !== undefined ? <span className="tab-count">{tab.count}</span> : null}
          </button>
        )
      )}
    </div>
  );
}
