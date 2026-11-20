import { useState, type FormEvent } from 'react';
import { getApiErrorMessage } from '../api/client';
import { projectApi } from '../api/projectApi';
import type { ProjectMember, ProjectRole } from '../types/project';

interface ManageMembersModalProps {
  open: boolean;
  projectId: number;
  ownerId: number;
  currentUserRole: ProjectRole | null;
  members: ProjectMember[];
  onClose: () => void;
  onUpdated: () => Promise<void>;
}

const ROLES: ProjectRole[] = ['Admin', 'Project Manager', 'Member'];

export function ManageMembersModal({
  open,
  projectId,
  ownerId,
  currentUserRole,
  members,
  onClose,
  onUpdated,
}: ManageMembersModalProps) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<ProjectRole>('Member');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!open) return null;

  const canAdd = currentUserRole === 'Admin' || currentUserRole === 'Project Manager';
  const canManageRolesOrRemove = currentUserRole === 'Admin';

  const handleAddMember = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);

    try {
      await projectApi.addMember(projectId, { email: email.trim(), role });
      setEmail('');
      setRole('Member');
      await onUpdated();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to add member.'));
    } finally {
      setBusy(false);
    }
  };

  const handleRoleChange = async (memberId: number, nextRole: ProjectRole) => {
    setError(null);
    setBusy(true);
    try {
      await projectApi.updateMemberRole(projectId, memberId, { role: nextRole });
      await onUpdated();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to update role.'));
    } finally {
      setBusy(false);
    }
  };

  const handleRemoveMember = async (memberId: number) => {
    setError(null);
    setBusy(true);
    try {
      await projectApi.removeMember(projectId, memberId);
      await onUpdated();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to remove member.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-40 bg-slate-900/40 flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-white border border-slate-200 rounded-xl shadow-lg p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900">Project Members</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 text-sm cursor-pointer"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm">
            {error}
          </div>
        )}

        {canAdd && (
          <form onSubmit={handleAddMember} className="flex flex-col sm:flex-row gap-2 mb-6">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="teammate@university.edu"
              className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
            />
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as ProjectRole)}
              className="px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
            <button
              type="submit"
              disabled={busy}
              className="px-4 py-2 text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 rounded-lg cursor-pointer"
            >
              Add
            </button>
          </form>
        )}

        <div className="divide-y divide-slate-100">
          {members.map((member) => {
            const isOwner = member.userId === ownerId;
            return (
              <div
                key={member.userId}
                className="py-3 flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <div className="text-sm font-medium text-slate-900 truncate">
                    {member.fullName}{' '}
                    {isOwner && (
                      <span className="ml-1 text-xs font-normal text-slate-500">(Owner)</span>
                    )}
                  </div>
                  <div className="text-xs text-slate-500 truncate">{member.email}</div>
                </div>

                <div className="flex items-center gap-2">
                  {canManageRolesOrRemove ? (
                    <select
                      value={member.role}
                      disabled={busy}
                      onChange={(e) =>
                        handleRoleChange(member.userId, e.target.value as ProjectRole)
                      }
                      className="px-2.5 py-1 text-xs font-medium border border-slate-300 rounded-md bg-white"
                    >
                      {ROLES.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className="px-2.5 py-1 text-xs font-medium rounded-md bg-slate-100 text-slate-700">
                      {member.role}
                    </span>
                  )}

                  {canManageRolesOrRemove && !isOwner && (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => handleRemoveMember(member.userId)}
                      className="px-2.5 py-1 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-md cursor-pointer"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
