import React, { useState } from 'react';
import Container from '@material-ui/core/Container';
import Typography from '@material-ui/core/Typography';

import styles from './EventsList.module.css'
import EventCard from '../EventCard/EventCard';
import { getDateElementsAsNumber, getHourElementsAsNumber } from '../../utils/utils';
import { Toolbar } from '@material-ui/core';
import SendPushNotificationDialog from '../SendPushNotificationDialog/SendPushNotificationDialog';

const EventListOfTheDay = ({ day, initialShow, setSelectedEventKey }) => {
    const [show, setShow] = useState(initialShow);

    return (
        <>
            <div onClick={() => setShow(!show)} style={{ cursor: 'pointer' }}>
                <Toolbar className={styles.Toolbar}>
                    <Typography variant='h5' component='div'>
                        {day.title}
                    </Typography>
                </Toolbar>
            </div>
            {show &&
                <Container
                    maxWidth='sm'
                    className={styles.MarginBottom16}>
                    {day.data.map((event, index) => (
                        <EventCard
                            key={`EventCard-${index}`}
                            setSelectedEvent={setSelectedEventKey}
                            eventKey={event.idLogro}
                            streamerPhoto={event.streamerPhoto}
                            streamerName={event.streamerName}
                            photoUrl={event.photoUrl}
                            title={event.titulo}
                            description={event.description}
                            onClick={() => console.log('press')} />
                    ))}
                </Container>
            }
        </>
    );
}

const EventsList = ({ events }) => {
    const [selectedEventKey, setSelectedEventKey] = useState(null);
    const orderedEvents = [];

    Object.keys(events).filter((eventKey) => {
        if (events[eventKey].dateUTC && events[eventKey].hourUTC) {
            return true;
        }

        return false;
    })
    // Create an array with the valid events
    .map((eventKey) => events[eventKey])
    // Sort the events by date
    .sort((a, b) => {
        const [aDay, aMonth, aYear] = getDateElementsAsNumber(a.dateUTC);
            const [aHour, aMinute] = getHourElementsAsNumber(a.hourUTC);
            const [bDay, bMonth, bYear] = getDateElementsAsNumber(b.dateUTC);
            const [bHour, bMinute] = getHourElementsAsNumber(b.hourUTC);

            const aEventDate = new Date(Date.UTC(aYear, aMonth - 1, aDay, aHour, aMinute));
            const bEventDate = new Date(Date.UTC(bYear, bMonth - 1, bDay, bHour, bMinute));

            return aEventDate.getTime() - bEventDate.getTime();
    })
    // Fill orderedEvents array for the SectionList of the LogrosList component
    .reverse().forEach((event) => {
        let [day, month, year] = getDateElementsAsNumber(event.dateUTC);
        let [hour, minute] = getHourElementsAsNumber(event.hourUTC);
        const localDate = new Date(Date.UTC(year, month - 1, day, hour, minute));

        const eventSectionTitle = `${localDate.getDate()}/${localDate.getMonth() + 1}/${localDate.getFullYear()}`;

        if (orderedEvents.some((eventsOfTheDay) => eventsOfTheDay.title === eventSectionTitle)) {
            orderedEvents[orderedEvents.length - 1].data.push(event);
        } else {
            orderedEvents.push({ title: eventSectionTitle, data: [ event ], indexDay: orderedEvents.length });
        }
    });

    return (
        <Container maxWidth='xl' className={styles.MarginBottom16}>
            {orderedEvents.map((dayEvents, index) => (
                <EventListOfTheDay
                    key={`EventList-${index}`}
                    initialShow={index < 6}
                    day={dayEvents}
                    setSelectedEventKey={setSelectedEventKey} />
            ))}
            <SendPushNotificationDialog
                open={Boolean(selectedEventKey)}
                onClose={() => setSelectedEventKey(null)}
                topic={selectedEventKey} />
        </Container>
    );
}

export default EventsList;
