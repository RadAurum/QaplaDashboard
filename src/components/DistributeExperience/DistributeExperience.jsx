import React, { useCallback, useState } from 'react';
import Container from '@material-ui/core/Container';
import Grid from '@material-ui/core/Grid';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';
import GetAppIcon from '@material-ui/icons/GetApp';

import { useDropzone } from 'react-dropzone';
import { useParams } from 'react-router-dom';
import * as xlsx from 'xlsx';

import styles from './DistributeExperience.module.css';
import ApproveExperienceDistributionDialog from '../ApproveExperienceDistributionDialog/ApproveExperienceDistributionDialog';
import { getEventParticipantsOnce } from '../../services/database';

const DistributeExperience = () => {
    const [ users, setUsers ] = useState([]);
    const [openApproveDialog, setOpenApproveDialog] = useState(false);
    const { eventId } = useParams();

    /**
     * Event called when a file enters on the dropzone, validates the excel document inserted
     * and handle the file
     *
     * @param {Array} uploadedFiles Array of files
     */
    const onDrop = useCallback((uploadedFiles) => {
        if (uploadedFiles.length === 1) {
            uploadedFiles.forEach((file) => {
                /**
                 * First part (before the + symbol) check if the document has a valid name
                 * The second part check if the extension is xls or xlsx files (excel files)
                 */
                if ((/^^[\w() -]+(.xls|.xlsx)$/).test(file.name.toLowerCase())) {
                    const reader = new FileReader();

                    reader.readAsArrayBuffer(file);

                    reader.onabort = () => console.log('file reading was aborted');
                    reader.onerror = () => console.log('file reading has failed');
                    reader.onloadend = async (e) => {
                        const data = new Uint8Array(e.target.result);
                        const workBook = xlsx.read(data, { type: 'array' });
                        const usersArray = [];

                        workBook.SheetNames.forEach((sheetName) => {
                            xlsx.utils.sheet_to_json(workBook.Sheets[sheetName])
                            .filter((user) => user.Experience || user.Qoins)
                            .sort((a, b) => b['Experience'] - a['Experience'])
                            .forEach((row) => {
                                usersArray.push(row);
                            });
                        });

                        setUsers(usersArray);
                        setOpenApproveDialog(true);
                    };
                } else {
                    alert('Tipo de archivo invalido');
                }
            });
        } else {
            alert('Solo se permite subir maximo un archivo');
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

    /**
     * Create an excel file for the user to download the template
     */
    const generateParticipantFormat = async () => {
        const participants = await getEventParticipantsOnce(eventId);

        if (participants) {
            const participantsData = Object.keys(participants)
            .sort((a, b) => {
                if (!participants[a].xqRedeemed) {
                    participants[a].xqRedeemed = 0;
                }

                if (!participants[b].xqRedeemed) {
                    participants[b].xqRedeemed = 0;
                }

                return participants[b].xqRedeemed - participants[a].xqRedeemed;
            })
            .map((participant) => {
                const { email, userName } = participants[participant];
                delete participants[participant].eventEntry;
                delete participants[participant].timeStamp;
                delete participants[participant].token;
                delete participants[participant].matchesPlayed;
                delete participants[participant].priceQaploins;
                delete participants[participant].victories;
                delete participants[participant].firebaseUserIdentifier;
                delete participants[participant].email;
                delete participants[participant].userName;
                participants[participant].Experience = participants[participant].xqRedeemed;
                delete participants[participant].xqRedeemed;
                participants[participant].Qoins = participants[participant].qoinsRedeemed;
                delete participants[participant].qoinsRedeemed;
                return {
                    'Qapla ID': participant,
                    Email: email,
                    UserName: userName,
                    ...participants[participant]
                }
            });

            const dataToWrite = xlsx.utils.json_to_sheet(participantsData);

            let newWorkBook = xlsx.utils.book_new();
            xlsx.utils.book_append_sheet(newWorkBook, dataToWrite, 'Experience');
            xlsx.writeFile(newWorkBook, 'ExperienceTemplate.xlsx');
        }
    }

    return (
        <Container>
            <Grid container spacing={3} className={styles.container}>
                <Grid item sm={6} xs={12}>
                    <Paper onClick={generateParticipantFormat} className={styles.pointer}>
                        <GetAppIcon className={styles.downloadIcon} /> Descarga la plantilla
                    </Paper>
                </Grid>
                <Grid item sm={6} xs={12}>
                    <Paper {...getRootProps()} className={styles.dropzoneContainer}>
                        <input {...getInputProps()} />
                            <div className={styles.alignTextCenter}>
                                {isDragActive ?
                                    <Typography>
                                        Dejalo caer aquí
                                    </Typography>
                                    :
                                    <Typography>
                                        Arrastra y suelta el documento aquí una vez que asignes la experiencia en excel o
                                        cualquier otro software de hojas de cálculo (debe ser un formato de los siguientes xlsx o xls)
                                        <br />
                                        También es valido dar click y buscar el archivo en tu computadora
                                    </Typography>
                                }
                            </div>
                    </Paper>
                </Grid>
                <ApproveExperienceDistributionDialog
                    open={openApproveDialog}
                    users={users}
                    eventId={eventId}
                    onClose={() => setOpenApproveDialog(false)} />
            </Grid>
        </Container>
    );
}

export default DistributeExperience;