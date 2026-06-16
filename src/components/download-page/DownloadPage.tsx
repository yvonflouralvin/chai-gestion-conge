'use client'
import PrintFunction from '@/components/download-page/PrintFunction'
import Image from 'next/image'
import React from 'react'
import { getLeaveRequestById } from '@/lib/requests'
import { LeaveRequest, Employee, LeaveRequestHistoryEntry } from '@/types'
import { getEmployeeById } from '@/lib/employee'
import { getLeaveRequestHistory, getWorkingDays } from '@/lib/leave-history'
import { leaveTypes } from '@/lib/data'
import { calculateLeaveDays } from '@/lib/utils'

const getLeaveTypeIcon = (id: number) => {
    const Icon = leaveTypes.find(lt => lt.id === id)?.icon;
    return Icon ? <Icon className="h-4 w-4" /> : null;
}

interface InfoZoneProps {
    children: React.ReactNode
}
function InfoZoneTitle(props: InfoZoneProps) {
    return <div className='border-t border-1 border-black p-[2px] text-[14px] text-white bg-blue-900 text-bold'>
        {props.children}
    </div>
}
function InfoZone(props: InfoZoneProps) {
    return <div className='border-t border-1 border-black p-[5px] text-[14px]'>
        {props.children}
    </div>
}
export default function DownloadPage({ id }: { id: string }) {
    const [leaveRequest, setLeaveRequest] = React.useState<LeaveRequest | null>(null)
    const [employeed, setEmployeed] = React.useState<Employee | null>(null)
    const [history, setHistory] = React.useState<LeaveRequestHistoryEntry[]>([]);


     

    React.useEffect(() => {
        const exec = async () => {
            const _leaveRequest = await getLeaveRequestById(id);
            const _historyData = await getLeaveRequestHistory(id);
            setHistory(_historyData)

            console.log(_leaveRequest)
            if (_leaveRequest != null) {
                setLeaveRequest(_leaveRequest)
                const _employee = await getEmployeeById(_leaveRequest.employeeId)
                console.log(_employee)
                if (_employee != null) {
                    setEmployeed(_employee)
                }
            }
        }
        exec();
    }, [])

    const returnToWorkDate = React.useMemo(() => {
        if (!leaveRequest?.endDate) return null;

        const nextDay = new Date(leaveRequest.endDate);
        nextDay.setDate(nextDay.getDate() + 1);

        // 0 = dimanche, 6 = samedi
        if (nextDay.getDay() === 6) {
            nextDay.setDate(nextDay.getDate() + 2);
        } else if (nextDay.getDay() === 0) {
            nextDay.setDate(nextDay.getDate() + 1);
        }

        return nextDay;
    }, [leaveRequest]);

    // Jours ouvres restants sur le contrat actif (aujourd'hui -> fin du contrat),
    // hors samedis/dimanches et jours feries (cf. publicHolidays dans lib/utils.ts).
    // null = contrat sans date de fin (en cours indetermine).
    const remainingContractDays = React.useMemo(() => {
        if (!employeed?.contractEndDate) return null;
        return calculateLeaveDays(new Date(), employeed.contractEndDate);
    }, [employeed]);

    return <>
        {
            (employeed != null && leaveRequest != null )? <>
                <div className='bg-white'>
                    <div className="flex items-center justify-center">
                        <Image
                            src={'/images.png'} width={200} height={200} alt="Logo Clinton Health Access" />
                    </div>
                    <p className='font-bold text-center underline my-[10px]'>Formulaire de demande de congé</p>
                    <div className="border border-1 border-black divide-y-1">
                        {/* Name */}
                        <InfoZoneTitle>
                            <p className='text-center'>Information sur le congé</p>
                        </InfoZoneTitle>
                        <InfoZone>
                            <p>Nom du travailleur : {employeed.name}</p>
                        </InfoZone>
                        {/* Name */}
                        <InfoZone>
                            <p>Fonction : {employeed.role}</p>
                        </InfoZone>
                        {/* Name */}
                        <InfoZone>
                            <p>Date de debut du contrat : {employeed.contractStartDate?.toDateString()}</p>
                        </InfoZone>
                        <InfoZone>
                            <p>Type de congé sollicité</p>
                        </InfoZone>
                        <InfoZone>
                            <div className="flex gap-[10px]">
                                {
                                    leaveTypes.map((leaveType) => {
                                        return <div className="flex gap-[4px]" key={leaveType.name}>
                                            <input type="checkbox" contentEditable={false} readOnly={true} checked={leaveRequest?.leaveTypeId === leaveType.id ? true : false} /> 
                                            {getLeaveTypeIcon(leaveType.id)}
                                            <p>{leaveType.name}</p>
                                        </div>
                                    })
                                }

                                {/* <div>
                                    <div className='flex gap-[4px]'>
                                        <input type="checkbox" contentEditable={false} readOnly={true} checked={leaveRequest?.leaveTypeId === 1 ? true : false} /> <p>Congé annuel</p>
                                    </div>
                                    <div className='flex gap-[4px]'>
                                        <input type="checkbox"  contentEditable={false}  readOnly={true} checked={leaveRequest?.leaveTypeId === 2 ? true : false} /> <p>Congé de mariage</p>
                                    </div>
                                    <div className='flex gap-[4px]'>
                                        <input type="checkbox"  contentEditable={false}  readOnly={true} checked={leaveRequest?.leaveTypeId === 3 ? true : false} /> <p>Décès</p>
                                    </div>
                                    <div className='flex gap-[4px]'>
                                        <input type="checkbox"  contentEditable={false}  readOnly={true} checked={leaveRequest?.leaveTypeId === 6 ? true : false} /> <p>Autres (à préciser): ........</p>
                                    </div>
                                </div>
                                <div>
                                    <div className='flex gap-[4px]'>
                                        <input type="checkbox"  contentEditable={false}  readOnly={true} checked={leaveRequest?.leaveTypeId === 5 ? true : false} /> <p>Congé non payé</p>
                                    </div>
                                    <div className='flex gap-[4px]'>
                                        <input type="checkbox"  contentEditable={false}  readOnly={true} checked={leaveRequest?.leaveTypeId === 4 ? true : false} /> <p>Congé de maternité</p>
                                    </div>
                                </div */ }
                            </div>
                        </InfoZone>
                        <InfoZone>
                            <p>* Période du contrat : {employeed.contractStartDate?.toLocaleDateString()} - {employeed.contractEndDate?.toLocaleDateString()}</p>
                            <p>* Nombre de jours restant sur la période du contrat : {remainingContractDays !== null ? remainingContractDays : 'Indéterminé (contrat sans date de fin)'}</p>
                        </InfoZone>
                        <InfoZone>
                            <p>Nombre de jours sollicité :  {getWorkingDays(leaveRequest?.startDate, leaveRequest?.endDate, true)}</p>
                        </InfoZone>
                        <InfoZone>
                            <p>Dates de congé : <span>Du {leaveRequest?.startDate.toLocaleDateString()}</span> <span>Au {leaveRequest?.endDate.toLocaleDateString()}</span></p>
                        </InfoZone>
                        <InfoZone>
                            <p>Date de reprise du travail : {returnToWorkDate?.toLocaleDateString()}</p>
                        </InfoZone>
                        <InfoZone>
                            <p>Signature du travailleur</p>
                            <p className='mt-[30px]'>Date :</p>
                        </InfoZone>
                        <InfoZoneTitle>
                            <p className="text-center">Approbations</p>
                        </InfoZoneTitle>
                        <InfoZone>
                            <>
                                <div className='flex gap-[4px]'>
                                    <input type="checkbox" checked={true}  contentEditable={false} readOnly={true} /> <p>Approuvé</p>
                                </div>
                                <div className='flex gap-[4px]'>
                                    <input type="checkbox" readOnly={true} checked={false}/> <p>Rejeté</p>
                                </div>
                            </>
                        </InfoZone>
                        <InfoZone>
                            <div className="min-height-[400px] height-[400px]">
                                <p>Commentaires : </p>
                            </div>
                        </InfoZone>
                        <InfoZone>
                            <p>Signature du Supérieur hiérarchique</p>
                            {history[history.length-2] && <p className="font-bold text-[14px]">{history[history.
                                length-2].actorName}</p> }
                                                            {history[history.length-2] && <p className="font-light text-[12px]">{history[history
                                .length-2].actorRole}</p> }
                                                            {history[history.length-2] && <p className="font-light text-[12px]">Date : {history[history.length-2].timestamp.toLocaleDateString()}</p> }
                                                        </InfoZone>
                                                        <InfoZone>
                                                            <p>Signature du Directeur Pays</p>
                                                            {history[history.length-1] && <p className="font-bold text-[14px]">{history[history.
                                length-1].actorName}</p> }
                                                            {history[history.length-1] && <p className="font-light text-[12px]">{history[history
                                .length-1].actorRole}</p> }
                                                            {history[history.length-1] && <p className="font-light text-[12px]">Date : {history[history.length-1].timestamp.toLocaleDateString()}</p> }
                        </InfoZone>
                    </div>
                    <div className='mt-[40px] text-[12px] text-blue-500 text-center'>
                        <p>Clinton Health Access Initiative Inc. Gombe, Kinshasa, République Démocratique du Congo</p>
                        <p>Tel: +243 821174170 <a href='https://www.clintonhealthaccess.org'>www.clintonhealthaccess.org</a></p>
                    </div>
                </div>
                <div className='opacity-1 justify-center items-center pb-[20px]'>
                    <PrintFunction />
                </div>
            </> : <></>
        }
    </>
}