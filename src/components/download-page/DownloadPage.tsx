'use client'
import PrintFunction from '@/components/download-page/PrintFunction'
import Image from 'next/image'
import React from 'react'
import { getLeaveRequestById } from '@/lib/requests'
import { LeaveRequest, Employee } from '@/types'
import { getEmployeeById } from '@/lib/employee'
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
    React.useEffect(() => {
        const exec = async () => {
            const _leaveRequest = await getLeaveRequestById(id);
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
                            <div className="flex">
                                <div>
                                    <div className='flex gap-[4px]'>
                                        <input type="checkbox" contentEditable={false} defaultChecked={leaveRequest?.leaveTypeId === 1} /> <p>Congé annuel</p>
                                    </div>
                                    <div className='flex gap-[4px]'>
                                        <input type="checkbox"  contentEditable={false}  defaultChecked={leaveRequest?.leaveTypeId === 2} /> <p>Congé de mariage</p>
                                    </div>
                                    <div className='flex gap-[4px]'>
                                        <input type="checkbox"  contentEditable={false}  defaultChecked={leaveRequest?.leaveTypeId === 3} /> <p>Décès</p>
                                    </div>
                                    <div className='flex gap-[4px]'>
                                        <input type="checkbox"  contentEditable={false}  defaultChecked={leaveRequest?.leaveTypeId === 6} /> <p>Autres (à préciser): ........</p>
                                    </div>
                                </div>
                                <div>
                                    <div className='flex gap-[4px]'>
                                        <input type="checkbox"  contentEditable={false}  defaultChecked={leaveRequest?.leaveTypeId === 5} /> <p>Congé non payé</p>
                                    </div>
                                    <div className='flex gap-[4px]'>
                                        <input type="checkbox"  contentEditable={false}  defaultChecked={leaveRequest?.leaveTypeId === 4} /> <p>Congé de maternité</p>
                                    </div>
                                </div>
                            </div>
                        </InfoZone>
                        <InfoZone>
                            <p>* Période du contrat : {employeed.contractStartDate?.toLocaleDateString()} - {employeed.contractEndDate?.toLocaleDateString()}</p>
                            <p>* Nombre de jours restant sur la période du contrat : {employeed.availableLeaveDays}</p>
                        </InfoZone>
                        <InfoZone>
                            <p>Nombre de jours sollicité : {leaveRequest?.endDate.getDate() - leaveRequest?.startDate.getDate()}</p>
                        </InfoZone>
                        <InfoZone>
                            <p>Dates de congé : <span>Du {leaveRequest?.startDate.toLocaleDateString()}</span> <span>Au {leaveRequest?.endDate.toLocaleDateString()}</span></p>
                        </InfoZone>
                        <InfoZone>
                            <p>Date de reprise du travail : </p>
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
                                    <input type="checkbox" defaultChecked  contentEditable={false} /> <p>Approuvé</p>
                                </div>
                                <div className='flex gap-[4px]'>
                                    <input type="checkbox" /> <p>Rejeté</p>
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
                            <p className='mt-[30px]'>Date :</p>
                        </InfoZone>
                        <InfoZone>
                            <p>Signature du Directeur Pays</p>
                            <p className='mt-[30px]'>Date :</p>
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