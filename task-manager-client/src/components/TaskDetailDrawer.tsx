import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { getApiErrorMessage } from '../api/client';
import { taskApi } from '../api/taskApi';
import type { ProjectMember } from '../types/project';
import type {
  Tag,
  TaskDetail,
  TaskPriority,
  TaskStatus,
} from '../types/task';
import { CreateTaskModal } from './CreateTaskModal';
import { PriorityBadge } from './PriorityBadge';
import { StatusBadge } from './StatusBadge';

interface TaskDetailDrawerProps {
  taskId: number | null;
  projectId: number;
  members: ProjectMember[];
  allTags: Tag[];
  onClose: () => void;
  onMutated: () => Promise<void>;
}

const TASK_STATUSES: TaskStatus[] = ['To Do', 'In Progress', 'In Review', 'Done'];
const TASK_PRIORITIES: TaskPriority[] = ['Low', 'Medium', 'High', 'Critical'];

export function TaskDetailDrawer({
  taskId,
  projectId,
  members,
  allTags,
  onClose,
  onMutated,
}: TaskDetailDrawerProps) {
  const [detail, setDetail] = useState<TaskDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('Medium');
  const [status, setStatus] = useState<TaskStatus>('To Do');
  const [assigneeId, setAssigneeId] = useState<string>('');
  const [dueDate, setDueDate] = useState('');
  const [saving, setSaving] = useState(false);

  const [commentText, setCommentText] = useState('');
  const [postingComment, setPostingComment] = useState(false);

  const [selectedTagToAdd, setSelectedTagToAdd] = useState<string>('');
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#0EA5E9');
  const [subtaskModalOpen, setSubtaskModalOpen] = useState(false);

  const hydrateForm = (d: TaskDetail) => {
    setTitle(d.title);
    setDescription(d.description ?? '');
    setPriority(d.priority);
    setStatus(d.status);
    setAssigneeId(d.assigneeId ? String(d.assigneeId) : '');
    setDueDate(d.dueDate ? d.dueDate.slice(0, 16) : '');
  };

  const loadDetail = useCallback(async () => {
    if (!taskId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await taskApi.getById(taskId);
      setDetail(res);
      hydrateForm(res);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load task details.'));
    } finally {
      setLoading(false);
    }
  }, [taskId]);

  useEffect(() => {
    if (taskId) {
      loadDetail();
    } else {
      setDetail(null);
    }
  }, [taskId, loadDetail]);

  if (!taskId) return null;

  const handleSaveTask = async (e: FormEvent) => {
    e.preventDefault();
    if (!detail) return;
    setSaving(true);
    setError(null);

    try {
      const updated = await taskApi.update(detail.taskId, {
        title: title.trim(),
        description: description.trim() ? description.trim() : null,
        priority,
        status,
        assigneeId: assigneeId ? Number(assigneeId) : null,
        parentTaskId: detail.parentTaskId,
        dueDate: dueDate ? new Date(dueDate).toISOString() : null,
      });
      setDetail(updated);
      hydrateForm(updated);
      await onMutated();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to update task.'));
    } finally {
      setSaving(false);
    }
  };

  const handleAddComment = async (e: FormEvent) => {
    e.preventDefault();
    if (!detail || !commentText.trim()) return;
    setPostingComment(true);
    setError(null);
    try {
      await taskApi.addComment(detail.taskId, { commentText: commentText.trim() });
      setCommentText('');
      await loadDetail();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to post comment.'));
    } finally {
      setPostingComment(false);
    }
  };

  const handleAssignExistingTag = async () => {
    if (!detail || !selectedTagToAdd) return;
    setError(null);
    try {
      await taskApi.assignTag(detail.taskId, Number(selectedTagToAdd));
      setSelectedTagToAdd('');
      await Promise.all([loadDetail(), onMutated()]);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to attach tag.'));
    }
  };

  const handleRemoveTag = async (tagId: number) => {
    if (!detail) return;
    setError(null);
    try {
      await taskApi.removeTag(detail.taskId, tagId);
      await Promise.all([loadDetail(), onMutated()]);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to remove tag.'));
    }
  };

  const handleCreateAndAttachTag = async (e: FormEvent) => {
    e.preventDefault();
    if (!detail || !newTagName.trim()) return;
    setError(null);
    try {
      const createdTag = await taskApi.createTag({
        tagName: newTagName.trim(),
        colorHex: newTagColor,
      });
      await taskApi.assignTag(detail.taskId, createdTag.tagId);
      setNewTagName('');
      await Promise.all([loadDetail(), onMutated()]);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to create tag.'));
    }
  };

  const availableTags = detail
    ? allTags.filter((t) => !detail.tags.some((assigned) => assigned.tagId === t.tagId))
    : [];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 flex justify-end">
      <div className="w-full max-w-2xl bg-white h-full shadow-xl border-l border-slate-200 overflow-y-auto p-6 space-y-6">
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-mono text-slate-400">#{detail?.taskId ?? taskId}</span>
              {detail && <StatusBadge status={detail.status} />}
              {detail && <PriorityBadge priority={detail.priority} />}
            </div>
            <h2 className="text-xl font-semibold text-slate-900 mt-1">
              {detail?.title ?? 'Task Details'}
            </h2>
            {detail?.parentTaskTitle && (
              <p className="text-xs text-slate-500 mt-0.5">
                Parent task: {detail.parentTaskTitle}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-2.5 py-1 text-sm text-slate-500 hover:text-slate-900 rounded-md hover:bg-slate-100 cursor-pointer"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm">
            {error}
          </div>
        )}

        {loading && !detail ? (
          <div className="text-sm text-slate-500 py-6">Loading task...</div>
        ) : (
          detail && (
            <>
              <form onSubmit={handleSaveTask} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Title</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Description
                  </label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Status</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as TaskStatus)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
                    >
                      {TASK_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      Priority
                    </label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value as TaskPriority)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
                    >
                      {TASK_PRIORITIES.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      Assignee
                    </label>
                    <select
                      value={assigneeId}
                      onChange={(e) => setAssigneeId(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
                    >
                      <option value="">Unassigned</option>
                      {members.map((m) => (
                        <option key={m.userId} value={m.userId}>
                          {m.fullName}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      Due Date
                    </label>
                    <input
                      type="datetime-local"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-4 py-2 text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 rounded-lg cursor-pointer"
                  >
                    {saving ? 'Saving...' : 'Save Task'}
                  </button>
                </div>
              </form>

              <section className="pt-5 border-t border-slate-200 space-y-3">
                <h3 className="text-sm font-semibold text-slate-900">Tags</h3>
                <div className="flex flex-wrap gap-1.5">
                  {detail.tags.map((tag) => (
                    <span
                      key={tag.tagId}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700"
                    >
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: tag.colorHex }}
                      />
                      {tag.tagName}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag.tagId)}
                        className="text-slate-400 hover:text-rose-600 ml-0.5 cursor-pointer"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  {detail.tags.length === 0 && (
                    <span className="text-xs text-slate-400">No tags attached.</span>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <select
                    value={selectedTagToAdd}
                    onChange={(e) => setSelectedTagToAdd(e.target.value)}
                    className="flex-1 px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="">Attach existing tag...</option>
                    {availableTags.map((t) => (
                      <option key={t.tagId} value={t.tagId}>
                        {t.tagName}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={handleAssignExistingTag}
                    disabled={!selectedTagToAdd}
                    className="px-3 py-1.5 text-xs font-medium text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                  >
                    Attach
                  </button>
                </div>

                <form onSubmit={handleCreateAndAttachTag} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                    placeholder="New tag name"
                    className="flex-1 px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                  />
                  <input
                    type="color"
                    value={newTagColor}
                    onChange={(e) => setNewTagColor(e.target.value)}
                    className="w-9 h-8 p-0.5 border border-slate-300 rounded cursor-pointer"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 text-xs font-medium text-white bg-slate-800 hover:bg-slate-900 rounded-lg cursor-pointer"
                  >
                    Create Tag
                  </button>
                </form>
              </section>

              <section className="pt-5 border-t border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-900">
                    Subtasks ({detail.subtasks.length})
                  </h3>
                  <button
                    type="button"
                    onClick={() => setSubtaskModalOpen(true)}
                    className="text-xs font-medium text-slate-700 hover:text-slate-900 cursor-pointer"
                  >
                    + Add Subtask
                  </button>
                </div>

                {detail.subtasks.length === 0 ? (
                  <p className="text-xs text-slate-400">No subtasks yet.</p>
                ) : (
                  <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg">
                    {detail.subtasks.map((sub) => (
                      <div
                        key={sub.taskId}
                        className="px-3 py-2.5 flex items-center justify-between gap-2 text-xs"
                      >
                        <span className="font-medium text-slate-800">{sub.title}</span>
                        <div className="flex items-center gap-2">
                          <PriorityBadge priority={sub.priority} />
                          <StatusBadge status={sub.status} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section className="pt-5 border-t border-slate-200 space-y-3">
                <h3 className="text-sm font-semibold text-slate-900">
                  Comments ({detail.comments.length})
                </h3>

                <div className="space-y-2.5">
                  {detail.comments.map((c) => (
                    <div
                      key={c.commentId}
                      className="p-3 rounded-lg bg-slate-50 border border-slate-200/80"
                    >
                      <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                        <span className="font-medium text-slate-800">{c.authorName}</span>
                        <span>{new Date(c.createdAt).toLocaleString()}</span>
                      </div>
                      <p className="text-sm text-slate-700">{c.commentText}</p>
                    </div>
                  ))}
                </div>

                <form onSubmit={handleAddComment} className="space-y-2">
                  <textarea
                    rows={2}
                    required
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Write a comment..."
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                  />
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={postingComment}
                      className="px-3.5 py-1.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 rounded-lg cursor-pointer"
                    >
                      {postingComment ? 'Posting...' : 'Post Comment'}
                    </button>
                  </div>
                </form>
              </section>

              <section className="pt-5 border-t border-slate-200 space-y-3">
                <h3 className="text-sm font-semibold text-slate-900">Audit Log</h3>
                {detail.auditLogs.length === 0 ? (
                  <p className="text-xs text-slate-400">No changes logged yet.</p>
                ) : (
                  <div className="space-y-2">
                    {detail.auditLogs.map((log) => (
                      <div
                        key={log.logId}
                        className="text-xs flex items-center justify-between gap-2 py-1.5 border-b border-slate-100"
                      >
                        <div className="text-slate-700">
                          <span className="font-medium text-slate-900">{log.fieldChanged}</span>:{' '}
                          <span className="line-through text-slate-400">
                            {log.oldValue ?? 'None'}
                          </span>{' '}
                          →{' '}
                          <span className="font-medium text-slate-900">
                            {log.newValue ?? 'None'}
                          </span>
                        </div>
                        <span className="text-slate-400 whitespace-nowrap">
                          {new Date(log.changedAt).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </>
          )
        )}

        <CreateTaskModal
          open={subtaskModalOpen}
          projectId={projectId}
          members={members}
          tags={allTags}
          parentTaskId={detail?.taskId ?? null}
          onClose={() => setSubtaskModalOpen(false)}
          onCreated={async () => {
            await Promise.all([loadDetail(), onMutated()]);
          }}
        />
      </div>
    </div>
  );
}
