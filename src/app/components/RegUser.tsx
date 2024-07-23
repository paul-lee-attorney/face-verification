
import { useEffect, useState } from "react";

import { Box, Divider, FormControl, FormHelperText, InputLabel, MenuItem, Paper, Select, Stack, TextField, } from "@mui/material";
import { BorderColor, UploadOutlined } from "@mui/icons-material";

import { FormResults, HexParser, defFormResults, hasError, onlyChars, onlyEmail, onlyHex, onlyInt, onlyNumOrChar, refreshAfterTx } from "../../../../common/toolsKit";
import { useGeneralKeeperRegInvestor } from "../../../../../../../generated";
import { ActionsOfInvestorProps } from "../ActionsOfInvestor";
import { Bytes32Zero, HexType, MaxUserNo } from "../../../../common";
import { LoadingButton } from "@mui/lab";
import { useComBooxContext } from "../../../../../_providers/ComBooxContextProvider";
import { UserInfo, countries, defaultUserInfo, idDocTypes, statesOfUS } from "../../../../../api";

import { useWalletClient } from "wagmi";
import { DateTimeField } from "@mui/x-date-pickers";
import dayjs from "dayjs";
import { CopyLongStrTF } from "../../../../common/CopyLongStr";
import { keccak256 } from "viem";
import getUserData from "../../../../../api/getData";
import setUserData from "../../../../../api/setData";

export function RegInvestor({ refresh }: ActionsOfInvestorProps) {
  const { gk, setErrMsg } = useComBooxContext();

  const [ groupRep, setGroupRep ] = useState<string>('0');
  const [ idHash, setIdHash ] = useState<HexType>(Bytes32Zero);

  const { data: signer } = useWalletClient();
  const [ userInfo, setUserInfo ] = useState<UserInfo>(defaultUserInfo);
  const [ signedInfo, setSignedInfo ] = useState<UserInfo>(defaultUserInfo); 

  const [ valid, setValid ] = useState<FormResults>(defFormResults);
  const [ loading, setLoading ] = useState(false);

  useEffect(()=>{
    if (signer && gk) {

      getUserData(gk, signer.account.address).then(
        info => {
          if (info && info.sig != '') {
            setUserInfo(info);
            setIdHash(keccak256(Buffer.from(info.sig)));
          } else {
            setUserInfo(v => ({
              ...v,
              address: signer.account.address,
              gk: gk,
            }));
          }
        }
      );
    }
  }, [signer, gk]);

  useEffect(()=>{
    if (signedInfo.sig != '') {
      const uploadInfo = async (signedInfo: UserInfo) => {
        setLoading(true);
        let res = await setUserData(signedInfo);
        if (res) {
          setIdHash(keccak256(Buffer.from(signedInfo.sig)));
        } 
        setLoading(false);
      }
      uploadInfo(signedInfo);
    }
  }, [signedInfo]);

  const signMessage = async () => {
    
    if (signer && gk) {

      console.log('userInfo: ', userInfo);

      let objInfo = {...userInfo, sig: ''};

      let message = JSON.stringify(objInfo, Object.keys(objInfo).sort());
      
      let sigM = await signer.signMessage({message: message});
      
      setSignedInfo(v => ({
        ... userInfo,
        sig: sigM
      }));
    }
  }

  const updateResults = ()=>{
    refresh();
    setLoading(false);
  }

  const {
    isLoading: regInvestorLoading,
    write:regInvestor,
  } = useGeneralKeeperRegInvestor({
    address: gk,
    onError(err) {
      setErrMsg(err.message);
    },
    onSuccess(data) {
      setLoading(true);
      let hash: HexType = data.hash;
      refreshAfterTx(hash, updateResults);
    }
  });
      
  const handleClick = ()=>{
    regInvestor({
      args: [ 
        BigInt(groupRep), 
        idHash
      ],
    })
  }

  return (

    <Paper elevation={3} sx={{
      m:1, p:1, 
      border: 1, 
      borderColor:'divider' 
      }} 
    >
      <Stack direction="row" sx={{ alignItems:'start'}} >

        <Box width={218} sx={{ mr:2 }}>        
          <CopyLongStrTF title="Address" src={userInfo.address} />
        </Box>

        <TextField 
          variant='outlined'
          size="small"
          label='First Name'
          error={ valid['First Name']?.error }
          helperText={ valid['First Name']?.helpTx ?? ' ' }
          sx={{
            m:1,
            minWidth: 218,
          }}
          onChange={ e => {
            let input = e.target.value;
            onlyChars('First Name', input, 64, setValid);
            setUserInfo(v => ({
              ...v,
              firstName: input,
            })); 
          }}
          value={ userInfo.firstName } 
        />

        <TextField 
          variant='outlined'
          size="small"
          label='Last Name'
          error={ valid['Last Name']?.error }
          helperText={ valid['Last Name']?.helpTx ?? ' ' }
          sx={{
            m:1,
            minWidth: 218,
          }}
          onChange={ e => {
            let input = e.target.value;
            onlyChars('Last Name', input, 64, setValid);
            setUserInfo(v => ({
              ...v,
              lastName: input,
            })); 
          }}
          value={ userInfo.lastName } 
        />

        <DateTimeField
          label='dateOfBirth'
          size='small'
          helperText=' '
          sx={{
            m:1,
            minWidth: 218,
          }} 
          value={ dayjs.unix(Number(userInfo.dateOfBirth))}
          onChange={(date) => setUserInfo((v) => ({
            ...v,
            dateOfBirth: date ? date.unix().toString() : '0',
          }))}
          format='YYYY-MM-DD HH:mm:ss'
        />

        <TextField 
          variant='outlined'
          size="small"
          label='Email'
          error={ valid['Email']?.error }
          helperText={ valid['Email']?.helpTx ?? ' ' }
          sx={{
            m:1,
            minWidth: 218,
          }}
          onChange={ e => {
            let input = e.target.value;
            onlyEmail('Email', input, setValid);
            setUserInfo(v => ({
              ...v,
              email: input,
            })); 
          }}
          value={ userInfo.email } 
        />

        <LoadingButton 
          disabled = { hasError(valid) }
          loading={loading}
          loadingPosition="end"
          sx={{ m: 1, minWidth: 218, height: 40 }} 
          variant="contained" 
          color='success'
          endIcon={<UploadOutlined />}
          onClick={ signMessage }
          size='small'
        >
          Sign & Upload
        </LoadingButton>


      </Stack>

      <Stack direction="row" sx={{ alignItems:'start'}} >

        <FormControl variant="outlined" size='small' sx={{ m: 1, minWidth: 218 }}>
          <InputLabel id="idDocType-label">DocumentType</InputLabel>
          <Select
            labelId="idDocType-label"
            id="idDocType"
            label="IdDocType"
            value={ 
              idDocTypes.indexOf(userInfo.documentType) != undefined
                    ? userInfo.documentType
                    : ''
              }
            onChange={(e) => setUserInfo((v) => ({
              ...v,
              documentType: e.target.value,
            }))}
          >
            {idDocTypes.map(v=>(<MenuItem key={v} value={v}>{v}</MenuItem>))}
          </Select>
          <FormHelperText>{' '}</FormHelperText>
        </FormControl>


        <FormControl variant="outlined" size='small' sx={{ m: 1, minWidth: 218 }}>
          <InputLabel id="issueCountry-label">IssueCountry / Area</InputLabel>
          <Select
            labelId="issueCountry-label"
            id="issueCountry-select"
            label="IssueCountry"
            value={
              countries.indexOf(userInfo.issueCountry) > 0
                  ? userInfo.issueCountry
                  : ''
            }
            onChange={(e) => setUserInfo((v) => ({
              ...v,
              issueCountry: e.target.value,
            }))}
          >
            {countries.map(v=>(<MenuItem key={v} value={v}>{v}</MenuItem>))}
          </Select>
          <FormHelperText>{' '}</FormHelperText>
        </FormControl>

        {userInfo.issueCountry == 'United States' && (
          <FormControl variant="outlined" size='small' sx={{ m: 1, minWidth: 218 }}>
            <InputLabel id="issueState-label">IssueState</InputLabel>
            <Select
              labelId="issueState-label"
              id="issueState-select"
              label="IssueState"
              value={
                statesOfUS.indexOf(userInfo.issueState) > 0
                  ? userInfo.issueState
                  : ''
              }
              onChange={(e) => setUserInfo((v) => ({
                ...v,
                issueState: e.target.value,
              }))}
            >
              {statesOfUS.map(v=>(<MenuItem key={v} value={v}>{v}</MenuItem>))}
            </Select>
            <FormHelperText>{' '}</FormHelperText>
          </FormControl>
        )}

        <DateTimeField
          label='dateOfExpiry'
          size='small'
          helperText=' '
          sx={{
            m:1,
            minWidth: 218,
          }} 
          value={ dayjs.unix(Number(userInfo.dateOfExpiry))}
          onChange={(date) => setUserInfo((v) => ({
            ...v,
            dateOfExpiry: date ? date.unix().toString() : '0',
          }))}
          format='YYYY-MM-DD HH:mm:ss'
        />

        <TextField 
          variant='outlined'
          size="small"
          label='DocumentNumber'
          error={ valid['DocumentNumber']?.error }
          helperText={ valid['DocumentNumber']?.helpTx ?? ' ' }
          sx={{
            m:1,
            minWidth: 218,
          }}
          onChange={ e => {
            let input = e.target.value;
            onlyNumOrChar('DocumentNumber', input, setValid);
            setUserInfo(v => ({
              ...v,
              documentNumber: input,
            })); 
          }}
          value={ userInfo.documentNumber } 
        />

      </Stack>

      <Divider orientation="horizontal" flexItem />

      <Stack direction="row" sx={{ alignItems:'start' }} >

        <TextField 
          variant='outlined'
          size="small"
          label='GroupRep'
          error={ valid['GroupRep']?.error }
          helperText={ valid['GroupRep']?.helpTx ?? ' ' }
          sx={{
            m:1,
            minWidth: 218,
          }}
          onChange={ e => {
            let input = e.target.value;
            onlyInt('GroupRep', input, MaxUserNo, setValid);
            setGroupRep(input); 
          }}
          value={ groupRep } 
        />

        <TextField
          variant='outlined'
          label='IdentityInfoHash'
          size="small"
          error={ valid['IDHash']?.error }
          helperText={ valid['IDHash']?.helpTx ?? ' ' }
          sx={{
            m:1,
            minWidth: 685,
          }}
          value={ idHash }
          onChange={(e)=>{
            let input = HexParser( e.target.value );
            onlyHex('IDHash', input, 64, setValid);
            setIdHash(input);
          }}
        />

        <LoadingButton 
          disabled = { regInvestorLoading || hasError(valid)}
          loading={loading}
          loadingPosition="end"
          sx={{ m: 1, minWidth: 218, height: 40 }} 
          variant="contained" 
          endIcon={<BorderColor />}
          onClick={ handleClick }
          size='small'
        >
          Register
        </LoadingButton>

      </Stack>

    </Paper>

  );  

}