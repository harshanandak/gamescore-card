import React, { useState } from 'react';

export default function TeamManager({ teams, onUpdateTeams, maxTeams = 10, minTeams = 2 }) {
  const [editingIndex, setEditingIndex] = useState(null);
  const [editName, setEditName] = useState('');
  const [editMembers, setEditMembers] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamMembers, setNewTeamMembers] = useState('');

  const startEdit = (index) => {
    setEditingIndex(index);
    setEditName(teams[index].name);
    setEditMembers(teams[index].members?.join(', ') || '');
  };

  const saveEdit = () => {
    if (!editName.trim()) return;

    const updatedTeams = [...teams];
    updatedTeams[editingIndex] = {
      ...updatedTeams[editingIndex],
      name: editName.trim(),
      members: editMembers.split(',').map(m => m.trim()).filter(m => m)
    };
    onUpdateTeams(updatedTeams);
    setEditingIndex(null);
    setEditName('');
    setEditMembers('');
  };

  const cancelEdit = () => {
    setEditingIndex(null);
    setEditName('');
    setEditMembers('');
  };

  const addTeam = () => {
    if (!newTeamName.trim() || teams.length >= maxTeams) return;

    const newTeam = {
      id: Date.now(),
      name: newTeamName.trim(),
      members: newTeamMembers.split(',').map(m => m.trim()).filter(m => m)
    };

    onUpdateTeams([...teams, newTeam]);
    setNewTeamName('');
    setNewTeamMembers('');
    setShowAddForm(false);
  };

  const deleteTeam = (index) => {
    if (teams.length <= minTeams) {
      alert(`Minimum ${minTeams} teams required`);
      return;
    }
    const updatedTeams = teams.filter((_, i) => i !== index);
    onUpdateTeams(updatedTeams);
  };

  return (
    <ul className="space-y-3" style={{ listStyle: 'none', padding: 0, margin: 0 }} aria-label="Team list">
      {/* Team List */}
      {teams.map((team, idx) => (
        <li key={team.id || idx} className="bg-gray-800 rounded-xl p-4 border border-gray-700">
          {editingIndex === idx ? (
            <div className="space-y-3">
              <div>
                <label htmlFor={`edit-team-name-${idx}`} className="block text-xs text-gray-400 mb-1">Team Name</label>
                <input
                  id={`edit-team-name-${idx}`}
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full p-2 bg-gray-700 rounded-lg border border-gray-600 focus:border-orange-400 outline-none text-white text-sm"
                  placeholder="Enter team name"
                  autoFocus
                />
              </div>
              <div>
                <label htmlFor={`edit-team-members-${idx}`} className="block text-xs text-gray-400 mb-1">Members (comma separated)</label>
                <input
                  id={`edit-team-members-${idx}`}
                  type="text"
                  value={editMembers}
                  onChange={(e) => setEditMembers(e.target.value)}
                  className="w-full p-2 bg-gray-700 rounded-lg border border-gray-600 focus:border-orange-400 outline-none text-white text-sm"
                  placeholder="John, Jane, Bob"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={saveEdit}
                  className="flex-1 bg-green-600 hover:bg-green-500 py-2 rounded-lg font-medium text-sm text-white"
                >
                  Save
                </button>
                <button
                  onClick={cancelEdit}
                  className="flex-1 bg-gray-600 hover:bg-gray-500 py-2 rounded-lg font-medium text-sm text-white"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <span className="w-8 h-8 bg-orange-500/20 text-orange-400 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0" aria-hidden="true">
                  {idx + 1}
                </span>
                <div className="min-w-0">
                  <span className="font-medium text-white block truncate">{team.name}</span>
                  {team.members && team.members.length > 0 && (
                    <span className="text-xs text-gray-400 block truncate">
                      {team.members.join(', ')}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button
                  onClick={() => startEdit(idx)}
                  className="text-blue-400 hover:text-blue-300 text-sm px-2 py-1"
                  aria-label={`Edit ${team.name}`}
                >
                  Edit
                </button>
                <button
                  onClick={() => deleteTeam(idx)}
                  className="text-red-400 hover:text-red-300 text-sm px-2 py-1"
                  aria-label={`Delete ${team.name}`}
                >
                  Delete
                </button>
              </div>
            </div>
          )}
        </li>
      ))}

      {/* Add Team Form */}
      {showAddForm ? (
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700 border-dashed">
          <div className="space-y-3">
            <div>
              <label htmlFor="new-team-name" className="block text-xs text-gray-400 mb-1">Team Name</label>
              <input
                id="new-team-name"
                type="text"
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
                className="w-full p-2 bg-gray-700 rounded-lg border border-gray-600 focus:border-orange-400 outline-none text-white text-sm"
                placeholder="Enter team name"
                autoFocus
              />
            </div>
            <div>
              <label htmlFor="new-team-members" className="block text-xs text-gray-400 mb-1">Members (comma separated, optional)</label>
              <input
                id="new-team-members"
                type="text"
                value={newTeamMembers}
                onChange={(e) => setNewTeamMembers(e.target.value)}
                className="w-full p-2 bg-gray-700 rounded-lg border border-gray-600 focus:border-orange-400 outline-none text-white text-sm"
                placeholder="John, Jane, Bob"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={addTeam}
                className="flex-1 bg-green-600 hover:bg-green-500 py-2 rounded-lg font-medium text-sm text-white"
              >
                Add Team
              </button>
              <button
                onClick={() => { setShowAddForm(false); setNewTeamName(''); setNewTeamMembers(''); }}
                className="flex-1 bg-gray-600 hover:bg-gray-500 py-2 rounded-lg font-medium text-sm text-white"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : teams.length < maxTeams && (
        <button
          onClick={() => setShowAddForm(true)}
          className="w-full p-4 rounded-xl border-2 border-dashed border-gray-600 text-gray-400 hover:border-gray-500 hover:text-gray-300 transition-colors"
        >
          + Add Team
        </button>
      )}
    </ul>
  );
}
