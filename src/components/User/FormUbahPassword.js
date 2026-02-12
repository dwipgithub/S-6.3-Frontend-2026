import React, { useState, useEffect } from 'react'
import axios from 'axios'
import jwt_decode from 'jwt-decode'
import { HiSaveAs } from 'react-icons/hi'
import { useNavigate } from 'react-router-dom'
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const FormUbahPassword = () => {
    const [id, setId] = useState('')
    const [token, setToken] = useState('')
    const [expire, setExpire] = useState('')
    const [passwordLama, setPasswordLama] = useState('')
    const [passwordBaru, setPasswordBaru] = useState('')
    const [passwordBaruConfirmation, setPasswordBaruConfirmation] = useState('')
    const [buttonStatus, setButtonStatus] = useState(false)
    const navigate = useNavigate()

    useEffect(() => {
        refreshToken()

        // eslint-disable-next-line react-hooks/exhaustive-deps
    },[])

    const refreshToken = async() => {
        try {
            const response = await axios.get('/apisirs6v2/token')
            setToken(response.data.accessToken)
            const decoded = jwt_decode(response.data.accessToken)
            setId(decoded.id)
            setExpire(decoded.exp)
        } catch (error) {
            if(error.response) {
                navigate('/')
            }
        }
    }

    const axiosJWT = axios.create()
    axiosJWT.interceptors.request.use(async(config) => {
        const currentDate = new Date()
        if (expire * 1000 < currentDate.getTime()) {
            const response = await axios.get('/apisirs6v2/token')
            config.headers.Authorization = `Bearer ${response.data.accessToken}`
            const decoded = jwt_decode(response.data.accessToken)
            setExpire(decoded.exp)
        }
        return config
    }, (error) => {
        return Promise.reject(error)
    })

    const Simpan = async (e) => {
        e.preventDefault()
        setButtonStatus(true)
        try {
            const customConfig = {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            } 
            await axiosJWT.patch('/apisirs6v2/users/' + id + '/admin',{
                passwordLama: passwordLama,
                passwordBaru: passwordBaru,
                passwordBaruConfirmation: passwordBaruConfirmation
            }, customConfig)
            
            toast('Password Berhasil Diubah', {
                position: toast.POSITION.TOP_RIGHT
            })
            setTimeout(() => {
                navigate('/')
            }, 1500);
        } catch (error) {
            setButtonStatus(false)
            toast(error.response.data.message, {
                position: toast.POSITION.TOP_RIGHT
            })
            console.log(error.response.data.message)
        }
    }

    return (
        <div className="container" style={{marginTop: "70px"}}>
            <div className="row">
                <div className="col-md-6">
                    
                </div>
                <div className="col-md-6">
                    <form onSubmit={Simpan}>
                        <div className='card'>
                            <div className='card-body'>
                                <h5 className="card-title h5">Ubah Password</h5>
                                <div className="form-floating mt-2 mb-2" style={{width:"100%", display:"inline-block"}}>
                                    <input type="password" className="form-control" id="floatingInput"
                                        value={ passwordLama } disabled={false} onChange={e => setPasswordLama(e.target.value)}/>
                                    <label htmlFor="floatingInput">Password Lama</label>
                                </div>
                                <div className="form-floating mb-2" style={{width:"100%", display:"inline-block"}}>
                                    <input type="password" className="form-control" id="floatingInput"
                                        value={ passwordBaru } disabled={false} onChange={e => setPasswordBaru(e.target.value)} />
                                    <label htmlFor="floatingInput">Password Baru</label>
                                </div>
                                <div className="form-floating" style={{width:"100%", display:"inline-block"}}>
                                    <input type="password" className="form-control" id="floatingInput"
                                        value={ passwordBaruConfirmation } disabled={false} onChange={e => setPasswordBaruConfirmation(e.target.value)} />
                                    <label htmlFor="floatingInput">Konfirmasi Password Baru</label>
                                </div>
                                <div className="mt-3">
                                    <ToastContainer />
                                    <button type="submit" className="btn btn-outline-success" disabled={buttonStatus}><HiSaveAs/> Simpan</button>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}

export default FormUbahPassword