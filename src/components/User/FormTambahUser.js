import React, { useState, useEffect } from 'react'
import axios from 'axios'
import jwt_decode from 'jwt-decode'
import { HiSaveAs } from 'react-icons/hi'
import { useNavigate } from 'react-router-dom'
import { ToastContainer, toast } from 'react-toastify';
import validator from 'validator'
import 'react-toastify/dist/ReactToastify.css';

const FormTambahUser = () => {
    const [token, setToken] = useState('')
    const [expire, setExpire] = useState('')
    const [nama, setNama] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [kriteriaUserId, setKriteriaUserId] = useState('')
    const [optionsKriteriaUser, setOptionsKriteriaUser] = useState([]);
    const [buttonStatus, setButtonStatus] = useState(false)
    const [errorMessagePassword, setErrorMessagePassword] = useState('')
    const navigate = useNavigate()

    useEffect(() => {
        refreshToken()
        getKriteriaUser()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const refreshToken = async () => {
        try {
            const response = await axios.get('/apisirs6v2/token')
            setToken(response.data.accessToken)
            const decoded = jwt_decode(response.data.accessToken)
            setExpire(decoded.exp)
        } catch (error) {
            if (error.response) {
                navigate('/')
            }
        }
    }

    const axiosJWT = axios.create()
    axiosJWT.interceptors.request.use(async (config) => {
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

    const getKriteriaUser = async () => {
        try {
            const response = await axiosJWT.get("/apisirs6v2/kriteriauser");
            const kriteriaUserDetails = response.data.data.map((value) => {
                return value;
            });

            const results = [];
            kriteriaUserDetails.forEach((value) => {
                results.push({
                    key: value.nama,
                    value: value.id
                });
            });
            setOptionsKriteriaUser([{ key: "Piih", value: "" }, ...results]);

        } catch (error) {
            if (error.response) {
                navigate("/");
            }
        }
    }

    const changeHandlerKriteriaUser = (event) => {
        setKriteriaUserId(event.target.value);
    }

    const validate = (value) => {
        setPassword(value)
        if (validator.isStrongPassword(value, {
            minLength: 8, maxLength: 8, minLowercase: 1,
            minUppercase: 1, minNumbers: 1, minSymbols: 1
        })) {
            setErrorMessagePassword('')
        } else {
            setErrorMessagePassword('Is Not Strong Password')
        }
    }

    const Simpan = async (e) => {
        e.preventDefault()
        if (kriteriaUserId === '') {
            toast('Kriteria pengguna tidak boleh kosong', {
                position: toast.POSITION.TOP_RIGHT
            })
            return
        } else if (kriteriaUserId !== '') {
            setButtonStatus(true)
            try {
                const customConfig = {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    }
                }
                await axiosJWT.post('/apisirs6v2/users/', {
                    nama: nama,
                    email: email,
                    password: password,
                    kriteriaUserId: kriteriaUserId
                }, customConfig)

                toast('Data telah disimpan, silahkan menghubungi admin untuk aktivasi', {
                    position: toast.POSITION.TOP_RIGHT
                })
                setTimeout(() => {
                    navigate('/beranda')
                }, 5500);
            } catch (error) {
                setButtonStatus(false)
                toast('data gagal disimpan', {
                    position: toast.POSITION.TOP_RIGHT
                })
                
                console.log(error.response.data.message)
            }
        }

    }

    return (
        <div className="container" style={{ marginTop: "70px" }}>
            <div className="row">
                <div className="col-md-6">

                </div>
                <div className="col-md-6">
                    <form onSubmit={Simpan}>
                        <div className='card'>
                            <div className='card-body'>
                                <h5 className="card-title h5">Tambah Pengguna</h5>
                                <div className="form-floating mt-2 mb-2" style={{ width: "100%", display: "inline-block" }}>
                                    <input type="text" className="form-control" id="nama"
                                        value={nama} disabled={false} onChange={e => setNama(e.target.value)} />
                                    <label htmlFor="nama">Nama</label>
                                </div>
                                <div className="form-floating mb-2" style={{ width: "100%", display: "inline-block" }}>
                                    <input type="email" className="form-control" id="email"
                                        value={email} disabled={false} onChange={e => setEmail(e.target.value)} />
                                    <label htmlFor="email">Email</label>
                                </div>
                                <div className="form-floating mb-2" style={{ width: "100%", display: "inline-block" }}>
                                    <input type="password" maxLength="8" className="form-control" id="password"
                                        value={password} disabled={false} onChange={e => validate(e.target.value.trim())} />
                                    <label htmlFor="password">Password</label>
                                </div>
                                <div>
                                    { errorMessagePassword === '' ? null :
                                        <span style={{
                                            fontWeight: 'bold',
                                            color: 'red',
                                        }}>
                                            {errorMessagePassword}
                                        </span>
                                    }
                                </div>
                                <div
                                    className="form-floating"
                                    style={{ width: "100%", display: "inline-block" }}
                                >
                                    <select
                                        name="kriteriaUser"
                                        typeof="select"
                                        className="form-control"
                                        id="kriteriaUser"
                                        placeholder="Kriteria User"
                                        onChange={(e) => changeHandlerKriteriaUser(e)}
                                    >
                                        {optionsKriteriaUser.map((option) => {
                                            return (
                                                <option
                                                    key={option.value}
                                                    name={option.key}
                                                    value={option.value}
                                                >
                                                    {option.key}
                                                </option>
                                            );
                                        })}
                                    </select>
                                    <label htmlFor="kriteriaUser">Kriteria Pengguna</label>
                                </div>
                                <div className="mt-3">
                                    <ToastContainer />
                                    <button type="submit" className="btn btn-outline-success" disabled={buttonStatus}><HiSaveAs /> Simpan</button>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}

export default FormTambahUser