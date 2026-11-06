// Turns an assignment (from api/client.js, with a `due` Date added) into an item the calendar views can draw.
// It has the same fields the views already use for events, plus kind: 'assignment'.

import { isDone } from './academic';
import { DEFAULT_COLOR } from './events';

export function assignmentToItem(a) {
  return {
    kind: 'assignment',
    id: `assignment-${a.id}`,
    title: a.title,
    courseName: a.course_name,
    color: a.course_color || DEFAULT_COLOR,
    start: a.due, // due is a single moment, so start and end are the same
    end: a.due,
    all_day: false,
    recurring: false,
    done: isDone(a.status),
    overdue: Boolean(a.overdue),
    assignment: a, // the full record, used when the item is clicked to edit it
  };
}
