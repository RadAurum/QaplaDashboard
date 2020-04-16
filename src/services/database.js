import { database } from './firebase';

const eventsRef = database.ref('/eventosEspeciales').child('eventsData');
const gamesRef = database.ref('/GamesResources');

/**
 * Returns the events ordered by their dateUTC field
 */
export async function loadEventsOrderByDate() {
    return await eventsRef.orderByChild('dateUTC').once('value');
}

/**
 * Save an event on the database
 * @param {object} eventData Data of the event to create
 * @param {function} onFinished Callback called when the event is created
 */
export function createEvent(eventData, onFinished) {
    const eventKey = eventsRef.push().key;
    eventData.idLogro = eventKey;
    eventsRef.child(eventKey).update(eventData, onFinished);
}

/**
 * Update the given event
 * @param {string} eventId Event identifier
 * @param {object} eventData Data of the event to update
 * @param {function} onFinished Callback called when the event is created
 */
export function updateEvent(eventId, eventData, onFinished) {
    eventsRef.child(eventId).update(eventData, onFinished);
}

/**
 * Delete an event from the database
 * @param {string} eventId Event identifier
 * @param {function} onFinished Callback called when the event is deleted
 */
export function deleteEvent(eventId, onFinished) {
    eventsRef.child(eventId).remove(onFinished);
}

export async function loadQaplaGames() {
    return (await gamesRef.once('value')).val();
}