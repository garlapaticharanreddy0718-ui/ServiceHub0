import React from 'react';
import { User, UserCheck, Building2 } from 'lucide-react';

const ROLES = [
  {
    id: 'customer',
    label: 'Customer',
    icon: User,
    description: 'Book services & manage appointments',
  },
  {
    id: 'staff',
    label: 'Staff',
    icon: UserCheck,
    description: 'Manage schedule & assigned appointments',
  },
  {
    id: 'owner',
    label: 'Owner',
    icon: Building2,
    description: 'Manage business, services & team',
  },
];

export default function RoleSelector({ selectedRole, onSelectRole, mode = 'login' }) {
  return (
    <div className="w-full space-y-2 mb-6">
      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider text-center">
        {mode === 'login' ? 'SIGNING IN AS:' : 'REGISTERING AS:'}
      </label>
      <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100/90 rounded-xl border border-slate-200/80 select-none">
        {ROLES.map((role) => {
          const Icon = role.icon;
          const isSelected = selectedRole === role.id;

          return (
            <button
              key={role.id}
              type="button"
              onClick={() => onSelectRole(role.id)}
              className={`flex items-center justify-center space-x-2 py-2.5 px-3 rounded-lg text-xs font-semibold transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${
                isSelected
                  ? 'bg-white text-slate-900 shadow-2xs border border-slate-200/60 font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
              aria-pressed={isSelected}
              title={role.description}
            >
              <Icon className={`w-4 h-4 ${isSelected ? 'text-indigo-600' : 'text-slate-400'}`} />
              <span>{role.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
