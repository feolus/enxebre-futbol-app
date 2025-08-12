import React, { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import Card from './Card';
import type { Player } from '../types';
import { UsersIcon } from './Icons';

type FormData = {
    name: string;
    lastName: string;
    nickname: string;
    idNumber: string;
    phone: string;
    email: string;
    password?: string;
    position: string;
    jerseyNumber: string;
    previousClub: string;
    fatherNamePhone: string;
    motherNamePhone: string;
    parentEmail: string;
    treatments: string;
    observations: string;
    age: string;
    height: string;
    weight: string;
};

interface FormProps {
  onClose: () => void;
  onSave: (playerData: any, idPhotoFile: File | null, dniFrontFile: File | null, dniBackFile: File | null) => Promise<void>;
  playerToEdit?: Player | null;
}

const inputStyle = "w-full bg-gray-800 border border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500";
const labelStyle = "block text-sm font-medium text-gray-300 mb-1";
const fileInputStyle = "w-full bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg text-center cursor-pointer";

const PlayerRegistrationForm: React.FC<FormProps> = ({ onClose, onSave, playerToEdit }) => {
    const isEditMode = !!playerToEdit;
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);

    const [formData, setFormData] = useState<FormData>({
        name: '',
        lastName: '',
        nickname: '',
        idNumber: '',
        phone: '',
        email: '',
        password: '',
        position: '',
        jerseyNumber: '',
        previousClub: '',
        fatherNamePhone: '',
        motherNamePhone: '',
        parentEmail: '',
        treatments: '',
        observations: '',
        age: '',
        height: '',
        weight: '',
    });
    
    const [idPhotoFile, setIdPhotoFile] = useState<File | null>(null);
    const [dniFrontFile, setDniFrontFile] = useState<File | null>(null);
    const [dniBackFile, setDniBackFile] = useState<File | null>(null);
    const [photoPreview, setPhotoPreview] = useState<string | null>(isEditMode ? playerToEdit.photoUrl : null);

    useEffect(() => {
        if (isEditMode && playerToEdit) {
            setFormData({
                name: playerToEdit.name.split(' ')[0] || '',
                lastName: playerToEdit.lastName || '',
                nickname: playerToEdit.nickname || '',
                idNumber: playerToEdit.idNumber || '',
                phone: playerToEdit.contactInfo.phone || '',
                email: playerToEdit.contactInfo.email || '',
                password: '', // Password is not edited here
                position: playerToEdit.position || '',
                jerseyNumber: String(playerToEdit.jerseyNumber) || '',
                previousClub: playerToEdit.previousClub || '',
                fatherNamePhone: playerToEdit.parentInfo.fatherNamePhone || '',
                motherNamePhone: playerToEdit.parentInfo.motherNamePhone || '',
                parentEmail: playerToEdit.parentInfo.parentEmail || '',
                treatments: playerToEdit.medicalInfo.treatments || '',
                observations: playerToEdit.observations || '',
                age: String(playerToEdit.personalInfo.age || ''),
                height: playerToEdit.personalInfo.height || '',
                weight: playerToEdit.personalInfo.weight || '',
            });
            setPhotoPreview(playerToEdit.photoUrl);
        }
    }, [playerToEdit, isEditMode]);

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };
  
    const handleFileChange = (e: ChangeEvent<HTMLInputElement>, fileType: 'photo' | 'dniFront' | 'dniBack') => {
        const { files } = e.target;
        if (files && files.length > 0) {
            const file = files[0];
            switch (fileType) {
                case 'photo':
                    setIdPhotoFile(file);
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        setPhotoPreview(reader.result as string);
                    };
                    reader.readAsDataURL(file);
                    break;
                case 'dniFront':
                    setDniFrontFile(file);
                    break;
                case 'dniBack':
                    setDniBackFile(file);
                    break;
            }
        }
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        
        if (!isEditMode && (!formData.password || formData.password.length < 6)) {
             setSubmitError("La contraseña es obligatoria y debe tener al menos 6 caracteres.");
             return;
        }

        setIsSubmitting(true);
        setSubmitError(null);
        
        const dataToSave = {
            ...formData,
            jerseyNumber: parseInt(formData.jerseyNumber, 10) || 0,
        };
        if (isEditMode) {
            delete (dataToSave as Partial<typeof dataToSave>).password;
        }

        try {
            await onSave(dataToSave, idPhotoFile, dniFrontFile, dniBackFile);
            // On success, the parent component (App or CoachDashboard) will handle closing/navigation.
        } catch (error: any) {
            console.error("Registration/Update failed in form:", error);
            let message = "Ha ocurrido un error inesperado. Por favor, inténtalo de nuevo más tarde.";
            if (error && typeof error.code === 'string') {
                switch (error.code) {
                    case 'auth/email-already-in-use':
                        message = 'Este correo electrónico ya está registrado. Por favor, utiliza otro.';
                        break;
                    case 'auth/invalid-email':
                        message = 'El formato del correo electrónico no es válido.';
                        break;
                    case 'auth/weak-password':
                        message = 'La contraseña es demasiado débil. Debe tener al menos 6 caracteres.';
                        break;
                    case 'auth/network-request-failed':
                         message = 'Error de red. Comprueba tu conexión a internet e inténtalo de nuevo.';
                         break;
                    default:
                        message = `Error de autenticación: ${error.message}`;
                }
            } else if (error instanceof Error) {
                message = error.message;
            }
            setSubmitError(message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Card className="w-full max-w-4xl flex flex-col max-h-[90vh] overflow-hidden">
            <form onSubmit={handleSubmit} className="flex flex-col h-full">
                <div className="p-6 md:p-8 shrink-0 border-b border-gray-700/50">
                    <h2 className="text-3xl font-bold text-white text-center">
                        {isEditMode ? 'Editar Jugador' : 'Registro del Jugador'}
                    </h2>
                </div>

                <div className="flex-grow overflow-y-auto">
                    <div className="px-6 md:px-8 py-6 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label htmlFor="name" className={labelStyle}>Nombre</label>
                                <input type="text" id="name" name="name" value={formData.name} className={inputStyle} placeholder="Introduce tu nombre" onChange={handleChange} required />
                            </div>
                            <div>
                                <label htmlFor="lastName" className={labelStyle}>Apellido</label>
                                <input type="text" id="lastName" name="lastName" value={formData.lastName} className={inputStyle} placeholder="Introduce tu apellido" onChange={handleChange} required />
                            </div>
                            <div>
                                <label htmlFor="nickname" className={labelStyle}>Apodo o Nombre en la Camiseta</label>
                                <input type="text" id="nickname" name="nickname" value={formData.nickname} className={inputStyle} placeholder="Introduce tu apodo" onChange={handleChange} />
                            </div>
                            <div>
                                <label htmlFor="idNumber" className={labelStyle}>Numero de DNI</label>
                                <input type="text" id="idNumber" name="idNumber" value={formData.idNumber} className={inputStyle} placeholder="Introduce tu número de DNI" onChange={handleChange} />
                            </div>
                            <div>
                                <label htmlFor="phone" className={labelStyle}>Número de Teléfono</label>
                                <input type="tel" id="phone" name="phone" value={formData.phone} className={inputStyle} placeholder="Introduce tu número de teléfono" onChange={handleChange} />
                            </div>
                            <div>
                                <label htmlFor="email" className={labelStyle}>Correo Electrónico (será tu usuario)</label>
                                <input type="email" id="email" name="email" value={formData.email} className={inputStyle} placeholder="Introduce tu correo electrónico" onChange={handleChange} required disabled={isEditMode} />
                            </div>
                            {!isEditMode && (
                                <div>
                                    <label htmlFor="password" className={labelStyle}>Contraseña</label>
                                    <input type="password" id="password" name="password" value={formData.password} className={inputStyle} placeholder="Crea una contraseña segura (mín. 6 caracteres)" onChange={handleChange} required />
                                </div>
                            )}
                            <div>
                                <label htmlFor="position" className={labelStyle}>Posición</label>
                                <select id="position" name="position" value={formData.position} className={inputStyle} onChange={handleChange} required>
                                    <option value="">Selecciona tu posición</option>
                                    <option value="Portero">Portero</option>
                                    <option value="Defensa">Defensa</option>
                                    <option value="Mediocampista">Mediocampista</option>
                                    <option value="Delantero">Delantero</option>
                                </select>
                            </div>
                            <div>
                                <label htmlFor="jerseyNumber" className={labelStyle}>Número de Camiseta</label>
                                <select id="jerseyNumber" name="jerseyNumber" value={formData.jerseyNumber} className={inputStyle} onChange={handleChange} required>
                                    <option value="">Selecciona tu número de camiseta (1-25)</option>
                                    {Array.from({ length: 25 }, (_, i) => i + 1).map(n => (
                                        <option key={n} value={n}>{n}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="md:col-span-2">
                                <label htmlFor="previousClub" className={labelStyle}>Club Anterior</label>
                                <input type="text" id="previousClub" name="previousClub" value={formData.previousClub} className={inputStyle} placeholder="Introduce el club anterior" onChange={handleChange} />
                            </div>
                        </div>

                        <hr className="border-gray-600"/>

                        <h3 className="text-xl font-semibold text-white">Datos Personales</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <label htmlFor="age" className={labelStyle}>Edad</label>
                                <input type="number" id="age" name="age" value={formData.age} className={inputStyle} placeholder="Ej: 21" onChange={handleChange} required />
                            </div>
                            <div>
                                <label htmlFor="height" className={labelStyle}>Altura</label>
                                <input type="text" id="height" name="height" value={formData.height} className={inputStyle} placeholder="Ej: 180cm" onChange={handleChange} required />
                            </div>
                            <div>
                                <label htmlFor="weight" className={labelStyle}>Peso</label>
                                <input type="text" id="weight" name="weight" value={formData.weight} className={inputStyle} placeholder="Ej: 75kg" onChange={handleChange} required />
                            </div>
                        </div>

                        <hr className="border-gray-600"/>

                        <h3 className="text-xl font-semibold text-white">Información de Contacto de los Padres</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label htmlFor="fatherNamePhone" className={labelStyle}>Nombre y Teléfono del Padre</label>
                                <input type="text" id="fatherNamePhone" name="fatherNamePhone" value={formData.fatherNamePhone} className={inputStyle} placeholder="Introduce el nombre y teléfono del padre" onChange={handleChange} />
                            </div>
                            <div>
                                <label htmlFor="motherNamePhone" className={labelStyle}>Nombre y Teléfono de la Madre</label>
                                <input type="text" id="motherNamePhone" name="motherNamePhone" value={formData.motherNamePhone} className={inputStyle} placeholder="Introduce el nombre y teléfono de la madre" onChange={handleChange} />
                            </div>
                            <div className="md:col-span-2">
                                <label htmlFor="parentEmail" className={labelStyle}>Correo Electrónico de los Padres</label>
                                <input type="email" id="parentEmail" name="parentEmail" value={formData.parentEmail} className={inputStyle} placeholder="Introduce el correo electrónico de los padres" onChange={handleChange} />
                            </div>
                        </div>

                        <hr className="border-gray-600"/>

                        <div>
                            <label htmlFor="treatments" className={labelStyle}>Enfermedades o Tratamientos</label>
                            <textarea id="treatments" name="treatments" rows={4} value={formData.treatments} className={inputStyle} placeholder="Introduce cualquier enfermedad o tratamiento" onChange={handleChange}></textarea>
                        </div>
                        
                        <hr className="border-gray-600"/>

                        <h3 className="text-xl font-semibold text-white">Documentación</h3>
                        <div className="space-y-4 bg-gray-900/30 p-4 rounded-lg">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                                <div className="text-center">
                                    {photoPreview ? (
                                        <img src={photoPreview} alt="Vista previa" className="w-28 h-28 rounded-full mx-auto object-cover border-4 border-gray-700"/>
                                    ) : (
                                        <div className="w-28 h-28 rounded-full mx-auto bg-gray-700 flex items-center justify-center">
                                            <UsersIcon className="w-12 h-12 text-gray-500"/>
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <label className={labelStyle}>Foto de Perfil</label>
                                    <p className="text-xs text-gray-400 mb-2">Sube una foto clara que se usará en toda la aplicación.</p>
                                    <label htmlFor="idPhoto-upload" className={fileInputStyle}>
                                        {idPhotoFile ? idPhotoFile.name : 'Seleccionar archivo...'}
                                    </label>
                                    <input id="idPhoto-upload" name="idPhotoUpload" type="file" className="hidden" onChange={(e) => handleFileChange(e, 'photo')} accept="image/*"/>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className={labelStyle}>DNI (Anverso)</label>
                                    <label htmlFor="dniFront-upload" className={fileInputStyle}>
                                        {dniFrontFile ? dniFrontFile.name : 'Seleccionar archivo...'}
                                    </label>
                                    <input id="dniFront-upload" name="dniFrontUpload" type="file" className="hidden" onChange={(e) => handleFileChange(e, 'dniFront')} accept="image/*,application/pdf"/>
                                </div>
                                <div>
                                    <label className={labelStyle}>DNI (Reverso)</label>
                                    <label htmlFor="dniBack-upload" className={fileInputStyle}>
                                        {dniBackFile ? dniBackFile.name : 'Seleccionar archivo...'}
                                    </label>
                                    <input id="dniBack-upload" name="dniBackUpload" type="file" className="hidden" onChange={(e) => handleFileChange(e, 'dniBack')} accept="image/*,application/pdf"/>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label htmlFor="observations" className={labelStyle}>Observaciones</label>
                            <textarea id="observations" name="observations" rows={4} value={formData.observations} className={inputStyle} placeholder="Introduce cualquier observación" onChange={handleChange}></textarea>
                        </div>
                    </div>
                </div>

                <div className="p-6 md:p-8 shrink-0 border-t border-gray-700/50">
                    {submitError && <p className="text-sm text-red-400 text-center pb-4">{submitError}</p>}
                    <div className="flex justify-end gap-4">
                        <button type="button" onClick={onClose} className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white font-bold rounded-lg transition-colors">
                            Cancelar
                        </button>
                        <button type="submit" disabled={isSubmitting} className="px-8 py-2 bg-cyan-500 hover:bg-cyan-600 text-white font-bold rounded-lg transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed">
                            {isSubmitting ? 'Guardando...' : (isEditMode ? 'Guardar Cambios' : 'Registrar')}
                        </button>
                    </div>
                </div>
            </form>
        </Card>
    );
};

export default PlayerRegistrationForm;
