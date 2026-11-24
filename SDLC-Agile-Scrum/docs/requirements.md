# Todo List user stories

The [browser Todo List](../../todo-list/) helps a person track tasks on one device. Stories TODO-01 through TODO-06 describe the current app. TODO-07 through TODO-10 describe proposed improvements.

## TODO-01 — Add a task

As a user, I want to add a task so I can remember what I need to do.

**Acceptance criteria**

- Submitting a non-empty task with Add or Enter puts it in the list as incomplete.
- The input clears and is ready for the next task.

## TODO-02 — Reject blank tasks

As a user, I want blank entries to be ignored so my list contains meaningful tasks.

**Acceptance criteria**

- Submitting an empty or space-only entry adds nothing.
- Leading and trailing spaces are trimmed from valid task text.

## TODO-03 — Complete a task

As a user, I want to check off a task so I can see what I have finished.

**Acceptance criteria**

- Checking the task marks it complete and strikes through its text.
- Other tasks keep their current completion state.

## TODO-04 — Reopen a completed task

As a user, I want to uncheck a completed task so I can correct an accidental completion.

**Acceptance criteria**

- Unchecking the task returns it to incomplete and removes the strikethrough.
- The task stays in its original position.

## TODO-05 — Delete a task

As a user, I want to remove a task so I can clear entries I no longer need.

**Acceptance criteria**

- Choosing Delete removes only the selected task.
- If two tasks have the same text, deleting one leaves the other intact.

## TODO-06 — Restore tasks after reload

As a returning user, I want my task list to survive a reload so I can pick up where I left off.

**Acceptance criteria**

- A reload restores all saved task text in the same order.
- Completed tasks remain checked and deleted tasks stay removed.

## TODO-07 — Edit a task

As a user, I want to correct a task's text so I can fix a mistake without recreating the task.

**Acceptance criteria**

- Saving a non-empty edit updates only that task's text and preserves its completion state.
- Cancel keeps the original text, and a blank edit cannot replace it.

## TODO-08 — Filter by completion

As a user, I want to filter the list by completion state so I can focus on the tasks I still need to do.

**Acceptance criteria**

- All shows every task, Active shows unchecked tasks, and Completed shows checked tasks.
- Changing the filter does not modify any saved tasks.

## TODO-09 — Show an empty-list message

As a first-time user, I want to know what to do when my list is empty so I can add my first task without guessing.

**Acceptance criteria**

- When the task list is empty, the page displays a short prompt to add a task.
- The prompt disappears after the first task is added and returns when the last task is deleted.

## TODO-10 — Undo a deletion

As a user, I want to undo my most recent deletion so I can recover a task removed by mistake.

**Acceptance criteria**

- After a deletion, Undo restores the task at its previous position with its original completion state.
- Reloading after Undo keeps the restored task.
