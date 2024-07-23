"use client"; 
import Image from 'next/image'
import styles from './page.module.css'
import ManagerInfoTicker from '../../components/ManagerInfoTicker'
import HeadlineTicker from '../../components/HeadlineTicker'
import CounselorInfoTicker from '../../components/CounselorInfoTicker'
import Cookies from "js-cookie"
import jwt from "jsonwebtoken"
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import LeftMenuSetting from '../../components/LeftMenuSetting';
import dateFormatYYMMDD_HHMM from '../../../utils/layout';
import { toast } from "react-hot-toast"
import TopMenuTicker from '../../components/TopMenuTicker';

export default function Home() {
  const router = useRouter();
  const searchParams = useSearchParams()
  const targetRef = useRef();
  const [dimensions, setDimensions] = useState({ width:0, height: 0 });
  const [isLoader, setLoader] = useState(false);
  const [indexBoard, setIndexBoard] = useState(1);
  const [data, setData] = useState([]);
  const [totalCount, setTotalCount] = useState();
  const [boardNumbers, setBoardNumbers] = useState([]);
  const [dictionaryID, setDictionaryID] = useState(null);

  useEffect(() => {
    const token = Cookies.get("token");
    if (!token) {
      router.replace("/login/", {scroll: false});
      return;
    }

    const validateToken = async () => {
      try {
        const res = await fetch("/api/protected", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!res.ok) throw new Error("Token validation failed");
      } catch (error) {
        console.log(error);
        router.replace("/login/", {scroll: false});
      }
    };

    validateToken();
  }, [router]);

  useEffect(() => {
    if(searchParams.get('index') != null) setIndexBoard(searchParams.get('index'));
  }, []);

  useEffect(() => {
    if(dictionaryID) {
      boostRemoveData();
    }
  }, [dictionaryID])

  useEffect(() => {
    boostListData();
  }, [indexBoard]);

  useEffect(() => {
    updateDimensions();
  }, [data]);

  useLayoutEffect(() => {
    if(targetRef.current) {
      setDimensions({
        width: targetRef.current.offsetWidth,
        height: targetRef.current.offsetHeight
      });
    }
  }, []);

  const updateDimensions = () => {
    if(targetRef.current) {
      setDimensions({
          width: targetRef.current.offsetWidth,
          height: targetRef.current.offsetHeight
      });
    }
  };
  const boostListData = async () => {
    try {
      setLoader(true);
      let url = `/api/setting/dictionaries/?index=${indexBoard}`;
      if(indexBoard == null) url = `/api/setting/dictionaries/`;
      const select = await fetch(url, {
        method: 'GET',
      });
      const content = await select.json();
      if(content.success) {
        setData(content.data);
        setTotalCount(content.totalCount);
        setLoader(false);
        
        let arr = [];
        const skipPage = Math.floor((indexBoard - 1) / 10) * 10;
        for (let i=0; i<10; i++) {
          if(i < Math.ceil(content.totalCount/10) - skipPage) {
            arr.push({number: i+skipPage+1})
          }
        }
        setBoardNumbers(arr);
      }else {
        setLoader(false);
        toast.error(content.message);
        router.refresh();
      }
    } catch (error) {
      setLoader(false);
      toast.error(error.message);
    }
  };
  const boostRemoveData = async () => {
    console.log(dictionaryID)
    if(!isLoader) {
      try {
        setLoader(true);
        let url = `/api/setting/dictionaries/remove`;
        const insert = await fetch(url, {
          method: 'DELETE',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            dictionaryID: dictionaryID
          }),
        });
        const content = await insert.json();
        if(content.success) {
          setLoader(false);
          // router.refresh();
          setData(null);
          boostListData();
        }else {
          setLoader(false);
          toast.error(content.message);
        }
      } catch (error) {
        setLoader(false);
        toast.error(error.message);
      }
    }
  };

  return (
    <>
      <div className={'B00'}></div>
      <div className={'B01'}></div>
      <main>
        <div className={styles.C00}>
          <ManagerInfoTicker/>
          <HeadlineTicker/>
          <TopMenuTicker indexOfNav={{
            level: 'setting',
          }}/>
        </div>
        <div className={styles.C01} style={{height: dimensions.height+40+'px'}}>
          <LeftMenuSetting indexOfNav={{
            level: 'dictionaries',
          }}
          />
          <div className={styles.C02} ref={targetRef}>
            <div className={styles.C05}>
              <div className={'C02 isOpacity isMini isUnderline isShort'}>
                <p className={'T05 P25'}>키워드</p>
                <p className={'T05 P25'}>설정</p>
                <p className={'T05 P50'}>등록정보</p>
              </div>
              <div className={'C05'}>
                {data && data.map((item, index) => {
                  return <div key={index} className={'C02 isPrevented'}>
                    <p className={'T05 P25'}>{item.WORD}</p>
                    <p className={'T05 P25'}><span className={'isStatus'} style={{cursor:'pointer'}} onClick={e => {
                      setDictionaryID(item._id[0]);
                    }}>삭제하기</span></p>
                    <p className={'T05 P35 isGray isMini'}>{dateFormatYYMMDD_HHMM(new Date(new Date(item.createdAt[0]).getTime() + (new Date(item.createdAt[0]).getTimezoneOffset() * 60 * 1000)))}</p>
                  </div>
                })}
              </div>
              <div className={'C04'}>
                <p className={'T06 styleSheet isFirst'} onClick={e => {
                  router.push(`/setting/branches/`, {scroll: false});
                  setIndexBoard(1);
                }}></p>
                <p className={'T06 styleSheet isPrev'} onClick={e => {
                  if(indexBoard > 10) {
                    router.push(`/setting/branches/?index=${Math.floor((indexBoard - 1) / 10)*10}`, {scroll: false});
                    setIndexBoard(Math.floor((indexBoard - 1) / 10)*10);
                  } else {
                    router.push(`/setting/branches/?index=1`, {scroll: false});
                    setIndexBoard(1);
                  }
                }}></p>
                <div className={'C05'}>
                  {boardNumbers.map((item, index) => {
                    return (<p key={index} className={`T06 isPager ${(indexBoard == item.number)? `isSelected`:null}`} onClick={e => {
                      router.push(`/setting/branches/?index=${item.number}`, {scroll: false});
                      setIndexBoard(item.number);
                    }}>{item.number}</p>)
                  })}
                </div>
                {Math.ceil(indexBoard / 10) != Math.ceil(totalCount / 100) ? <><p className={'T06 styleSheet isNext'} onClick={e => {
                  router.push(`/setting/branches/?index=${Math.ceil(indexBoard / 10)*10 + 1}`, {scroll: false});
                  setIndexBoard(Math.ceil(indexBoard / 10)*10 + 1);
                }}></p><p className={'T06 styleSheet isEnd'} onClick={e => {
                  router.push(`/setting/branches/?index=${Math.ceil(totalCount / 10)}`, {scroll: false});
                  setIndexBoard(Math.ceil(totalCount / 10));
                }}></p></> : null}
              </div>
              <div>
                <Link scroll={false} href="/setting/dictionaries/add/"><p className={styles.T00}>사전 추가</p></Link>
              </div>
            </div>
          </div>
          <div className={styles.C03} style={{height: dimensions.height+'px'}}>
            <div className={styles.C06}>
              <CounselorInfoTicker/>
            </div>
          </div>
        </div>
        {isLoader ? <div className={'loading'}>
          <div className={'loading-back'}></div>
          <Image className={'loading-img'} src='/img/loading.gif' width={400} height={300} alt='로딩' />
        </div> : null}
      </main>
    </>
  )
}