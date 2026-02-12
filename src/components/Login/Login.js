import React, { useRef, useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import style from './Login.module.css'
import { BoxArrowDownRight} from "react-bootstrap-icons";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import sirsImage from '../Images/sirsImage4.jpeg'
// import ReCAPTCHA from "react-google-recaptcha"

const Login = () => {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const reCaptchaReference = useRef(null)
    const navigate = useNavigate()
    // const googleReCaptchaSiteKey = process.env.REACT_APP_GOOGLE_RECAPTCHA_SITE_KEY

    const Auth = async(e) => {
        e.preventDefault()
        // const reCaptchaToken = reCaptchaReference.current.getValue()
        try {
            const customConfig = {
                headers: {
                    'Content-Type': 'application/json'
                }
            } 
            const results = await axios.post('/apisirs6v2/login',{
                userName: email,
                password: password
                // reCaptchaToken: reCaptchaToken
            }, customConfig)
            navigate("/beranda")
        } catch (error) {
            // reCaptchaReference.current.reset()
            if(error.response) {
                toast(error.response.data.message, {
                    position: toast.POSITION.TOP_RIGHT
                })
            }
        }
    }

    return (
        <div className={`container`}>
            <div className="row">
                <div className="col-md-12">
                    <div className={`row ${style.content}`}>
                        <div className="col-md-6">
                            <div>
                                <img
                                    src={sirsImage}
                                    className="img-fluid"
                                    alt=""
                                />
                            </div>
                        </div>
                        <div className="col-md-6">
                            <div className="row align-items-center" style={{minHeight: "65vh"}}>
                                <div className="col-md-12">
                                    <h3 className="h3 mb-3"> Login</h3>
                                    <form onSubmit={ Auth }>
                                        <div className="form-floating mb-3">
                                            <input type="text" className="form-control" id="floatingInput" 
                                                value={email} onChange={(e) => setEmail(e.target.value)}/>
                                            <label htmlFor="floatingInput">User Name</label>
                                        </div>
                                        <div className="form-floating">
                                            <input type="password" className="form-control" id="floatingPassword" 
                                                value={password} onChange={(e) => setPassword(e.target.value)}/>
                                            <label htmlFor="floatingPassword">Password</label>
                                        </div>
                                        {/* <ReCAPTCHA
                                            className="mt-3"
                                            sitekey={googleReCaptchaSiteKey}
                                            ref={reCaptchaReference}
                                        /> */}
                                        <div className="mt-3">
                                            <ToastContainer />
                                            <button className="btn btn-outline-success"><BoxArrowDownRight/> Login</button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Login