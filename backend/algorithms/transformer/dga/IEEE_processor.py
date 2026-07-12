import numpy as np
from scipy.stats import linregress

#################################### input parmeters #########################
class IEEEProcessor:
    """
    A class to encapsulate an algorithm that processes multiple NumPy arrays, lists, and an integer.

    This class demonstrates how to organize your algorithm into a class with methods.
    """

    def __init__(self):
        """
        Initializes the MyAlgorithmProcessor.
        Currently, no specific state is initialized, but you can add attributes here
        if your algorithm needs to maintain state across method calls.
        """
        pass

    def IEEE_DETECTTION(
        self,
        samples: np.ndarray,
        gas_name,
        days: np.ndarray,
        max_day: int,
        tfr_age: int
        
    ) -> np.ndarray:
            ieee_tb1=np.array([
                [80 , 90  , 90  , 50 , 1 , 900 , 9000 ],
                [75 , 45  , 30  , 20 , 1 , 900 , 5000 ],
                [75 , 90  , 90  , 50 , 1 , 900 , 10000],
                [100, 110 , 150 , 90 , 1 , 900 , 10000],
                [40 , 20  , 15  , 50 , 2 , 500 , 5000 ],
                [40 , 20  , 15  , 25 , 2 , 500 , 3500 ],
                [40 , 20  , 15  , 60 , 2 , 500 , 5500 ],
                [40 , 20  , 15  , 60 , 2 , 500 , 5500 ],
                ])
            ieee_tb2=np.array([
                [200 , 150 , 175 , 100 , 2 , 1100 , 12500],
                [200 , 100 , 70  , 40  , 2 , 1100 , 7000 ],
                [200 , 150 , 175 , 95  , 2 , 1100 , 14000],
                [200 , 200 , 250 , 175 , 4 , 1100 , 14000],
                [90 , 50  , 40   , 100 , 7 , 600  , 7000 ],
                [90 , 60  , 30   , 80  , 7 , 600  , 5000 ],
                [90 , 60  , 40   , 125 , 7 , 600  , 8000 ],
                [90 , 30  , 40   , 125 , 7 , 600  , 8000 ],
                ])
            ieee_tb3=np.array([
                [40 , 30 , 25 , 20 , 0 , 250 , 2500],
                [25 , 10 , 7  , 20 , 0 , 175 , 1750],
            ])
            ieee_tb4=np.array([
                [50 , 15 , 15, 10 , 0 , 200 , 1750 ],
                [20 , 10 , 9 , 7  , 0 , 100 , 1000 ],
                [25 , 4  , 3 , 7  , 0 , 100 , 1000 ],
                [10 , 3  , 2 , 5  , 0 , 80  , 800  ],
            ])
            nptr=len(days)
            o2 = samples[1,:].astype(float)
            n2 = samples[2,:].astype(float)
            tfr_o2n2 = np.where(n2 != 0, np.round(o2 / n2, 3), 0)
            dev_samples=np.zeros((9,nptr))
            for i in range (9):
                for j in range (1,nptr):
                    dev_samples[i,j]=samples[i,j]-samples[i,j-1]
            dev_samples[:,0]=0

                

            pdcta=np.zeros((9,nptr))
            pdctas=[[None for _ in range(nptr)] for _ in range(9)]
            mlplpy=[[None for _ in range(nptr)] for _ in range(9)]
            predicted_valuea=np.zeros((9,nptr))
            gasvalue=samples
            durat=np.zeros(nptr)
            for j in range (nptr):
                daya6=days[j-5:j+1].astype(float)
                for i in range (9):

                    if j<=4:
                        mlplpy[i][j]="NA"
                    else:
                        tvalwa6=(gasvalue[i,j-5:j+1]).astype(float)
                        slope6, intercept6, r_value6, p_value6, std_err6 = linregress(daya6, tvalwa6)
                        predicted_valuea6=( slope6 * daya6 + intercept6)
                        mlplpy[i][j]=(predicted_valuea6[-1]-predicted_valuea6[0])*365/(daya6[-1]-daya6[0])
                


            for j in range (nptr):
                if j==0:
                    for i in range (9):
                        pdcta[i,0]=gasvalue[i,0]
                        pdctas[i][0]="NA"
                    durat[j]=0  
                elif j==1:
                    for i in range (9):
                        pdcta[i,1]=gasvalue[i,1]
                        pdctas[i][1]="NA"
                    durat[j]=0
                elif j==2:
                    for i in range (9):
                        pdcta[i,2]=gasvalue[i,2]
                        pdctas[i][2]="NA"
                    durat[j]=0
                elif j==3:
                    daya=days[0:j+1].astype(float)
                    if daya[j]<max_day:
                        for i in range (9):
                            tvalwa=(gasvalue[i,0:j+1]).astype(float)
                            slope, intercept, r_value, p_value, std_err = linregress(daya, tvalwa)
                            predicted_valuea=( slope * daya + intercept)
                            pdcta[i,j]=(predicted_valuea[j]-predicted_valuea[0])*365/daya[j]
                            pdctas[i][j]=(predicted_valuea[j]-predicted_valuea[0])*365/daya[j]
                        durat[j]=daya[j]  
                    else:
                        pdcta[i,2]=gasvalue[i,2]
                        pdctas[i][2]="NA"
                        durat[j]=0 
                elif j==4:
                    daya5=days[j-4:j+1].astype(float)
                    daya4=days[j-3:j+1].astype(float)
                    for i in range (9):
                        tvalwa5=(gasvalue[i,j-4:j+1]).astype(float)
                        tvalwa4=(gasvalue[i,j-3:j+1]).astype(float)
                        slope5, intercept5, r_value, p_value, std_err = linregress(daya5, tvalwa5)
                        slope4, intercept4, r_value4, p_value4, std_err4 = linregress(daya4, tvalwa4)
                        predicted_valuea5=( slope5 * daya5 + intercept5)
                        predicted_valuea4=( slope4 * daya4 + intercept4)
                        if daya5[j]-daya5[j-4]<max_day :
                            pdcta[i,j]=(predicted_valuea5[j]-predicted_valuea5[j-4])*365/(daya5[j]-daya5[j-4])
                            pdctas[i][j]=(predicted_valuea5[j]-predicted_valuea5[j-4])*365/(daya5[j]-daya5[j-4])
                            durat[j]=(daya5[j]-daya5[j-4])
                        elif daya4[j-1]-daya4[j-4]<max_day :
                            pdcta[i,j]=(predicted_valuea4[j-1]-predicted_valuea4[j-4])*365/(daya4[j-1]-daya4[j-4])
                            pdctas[i][j]=(predicted_valuea4[j-1]-predicted_valuea4[j-4])*365/(daya4[j-1]-daya4[j-4])
                            durat[j]=(daya4[j-1]-daya4[j-4])
                        else:
                            pdcta[i,j]=gasvalue[i,j]
                            pdctas[i][j]="NA"
                            durat[j]=0               
                elif j>4:
                    daya6=days[j-5:j+1].astype(float)
                    daya5=days[j-4:j+1].astype(float)
                    daya4=days[j-3:j+1].astype(float)
                    for i in range (9):
                        tvalwa6=(gasvalue[i,j-5:j+1]).astype(float)
                        tvalwa5=(gasvalue[i,j-4:j+1]).astype(float)
                        tvalwa4=(gasvalue[i,j-3:j+1]).astype(float)

                        slope6, intercept6, r_value6, p_value6, std_err6 = linregress(daya6, tvalwa6)
                        slope5, intercept5, r_value5, p_value5, std_err5 = linregress(daya5, tvalwa5)
                        slope4, intercept4, r_value4, p_value4, std_err4 = linregress(daya4, tvalwa4)
                        predicted_valuea6=( slope6 * daya6 + intercept6)
                        predicted_valuea5=( slope5 * daya5 + intercept5)
                        predicted_valuea4=( slope4 * daya4 + intercept4)
                        if daya6[5]-daya6[0]<max_day :
                            pdcta[i,j]=((predicted_valuea6[5]-predicted_valuea6[0])*365/(daya6[5]-daya6[0]))
                            pdctas[i][j]=(predicted_valuea6[5]-predicted_valuea6[0])*365/(daya6[5]-daya6[0])
                            durat[j]=(daya6[5]-daya6[0])
                        elif daya5[4]-daya5[0]<max_day :
                            pdcta[i,j]=(predicted_valuea5[4]-predicted_valuea5[0])*365/(daya5[4]-daya5[0])
                            pdctas[i][j]=(predicted_valuea5[4]-predicted_valuea5[0])*365/(daya5[4]-daya5[0])
                            durat[j]=(daya5[4]-daya5[0])
                        elif daya4[3]-daya4[0]<max_day :
                            pdcta[i,j]=(predicted_valuea4[3]-predicted_valuea4[0])*365/(daya4[3]-daya4[0])
                            pdctas[i][j]=(predicted_valuea4[3]-predicted_valuea4[0])*365/(daya4[3]-daya4[0])
                            durat[j]=(daya4[3]-daya4[0])
                        else:
                            pdcta[i,j]=gasvalue[i,j]
                            pdctas[i][j]="NA"
                            durat[j]=0     

            samples=samples.T
            dev_samples=dev_samples.T

            #***********************************************************  IEEE TABLE 1 ********************************************************************

            sts_tb1=np.zeros(nptr)
            sts_tb2=np.zeros(nptr)
            sts_tb3=np.zeros(nptr)
            sts_tb4=np.zeros(nptr)
            if tfr_age=="NA":
                for i in range (nptr):
                    if tfr_o2n2[i]<=0.2:
                        if samples[i, 0]<ieee_tb1[0,0] and samples[i, 5]<ieee_tb1[0,1] and samples[i, 7]<ieee_tb1[0,2] and samples[i, 6]<ieee_tb1[0,3] and samples[i, 8]<ieee_tb1[0,4] and samples[i, 3]<ieee_tb1[0,5] and samples[i, 4]<ieee_tb1[0,6]:
                            sts_tb1[i]=1
                        else :
                            sts_tb1[i]=0             
                    elif tfr_o2n2[i]>0.2:
                        if samples[i, 0]<ieee_tb1[4,0] and samples[i, 5]<ieee_tb1[4,1] and samples[i, 7]<ieee_tb1[4,2] and samples[i, 6]<ieee_tb1[4,3] and samples[i, 8]<ieee_tb1[4,4] and samples[i, 3]<ieee_tb1[4,5] and samples[i, 4]<ieee_tb1[4,6]:
                            sts_tb1[i]=1                      
                        else :
                            sts_tb1[i]=0

                            
            elif tfr_age<10:
                for i in range (nptr):
                    if tfr_o2n2[i]<=0.2:
                        if samples[i, 0]<ieee_tb1[1,0] and samples[i, 5]<ieee_tb1[1,1] and samples[i, 7]<ieee_tb1[1,2] and samples[i, 6]<ieee_tb1[1,3] and samples[i, 8]<ieee_tb1[1,4] and samples[i, 3]<ieee_tb1[1,5] and samples[i, 4]<ieee_tb1[1,6]:
                            sts_tb1[i]=1
                        else :
                            sts_tb1[i]=0            
                    elif tfr_o2n2[i]>0.2:
                        if samples[i, 0]<ieee_tb1[5,0] and samples[i, 5]<ieee_tb1[5,1] and samples[i, 7]<ieee_tb1[5,2] and samples[i, 6]<ieee_tb1[5,3] and samples[i, 8]<ieee_tb1[5,4] and samples[i, 3]<ieee_tb1[5,5] and samples[i, 4]<ieee_tb1[5,6]:
                            sts_tb1[i]=1                       
                        else :
                            sts_tb1[i]=0 

            elif tfr_age>=10 and tfr_age <30 :
                for i in range (nptr):
                    if tfr_o2n2[i]<=0.2:
                        if samples[i, 0]<ieee_tb1[2,0] and samples[i, 5]<ieee_tb1[2,1] and samples[i, 7]<ieee_tb1[2,2] and samples[i, 6]<ieee_tb1[2,3] and samples[i, 8]<ieee_tb1[2,4] and samples[i, 3]<ieee_tb1[2,5] and samples[i, 4]<ieee_tb1[2,6]:
                            sts_tb1[i]=1
                        else :
                            sts_tb1[i]=0             
                    elif tfr_o2n2[i]>0.2:
                        if samples[i, 0]<ieee_tb1[6,0] and samples[i, 5]<ieee_tb1[6,1] and samples[i, 7]<ieee_tb1[6,2] and samples[i, 6]<ieee_tb1[6,3] and samples[i, 8]<ieee_tb1[6,4] and samples[i, 3]<ieee_tb1[6,5] and samples[i, 4]<ieee_tb1[6,6]:
                            sts_tb1[i]=1                      
                        else :
                            sts_tb1[i]=0


            elif tfr_age>=30:
                for i in range (nptr):
                    if tfr_o2n2[i]<=0.2:
                        if samples[i, 0]<ieee_tb1[3,0] and samples[i, 5]<ieee_tb1[3,1] and samples[i, 7]<ieee_tb1[3,2] and samples[i, 6]<ieee_tb1[3,3] and samples[i, 8]<ieee_tb1[3,4] and samples[i, 3]<ieee_tb1[3,5] and samples[i, 4]<ieee_tb1[3,6]:
                            sts_tb1[i]=1
                        else :
                            sts_tb1[i]=0            
                    elif tfr_o2n2[i]>0.2:
                        if samples[i, 0]<ieee_tb1[7,0] and samples[i, 5]<ieee_tb1[7,1] and samples[i, 7]<ieee_tb1[7,2] and samples[i, 6]<ieee_tb1[7,3] and samples[i, 8]<ieee_tb1[7,4] and samples[i, 3]<ieee_tb1[7,5] and samples[i, 4]<ieee_tb1[7,6]:
                            sts_tb1[i]=1                       
                        else :
                            sts_tb1[i]=0 
                                            
            #***********************************************************  IEEE TABLE 2 ********************************************************************
            if tfr_age == "NA":
                for i in range(nptr):
                    if tfr_o2n2[i] <= 0.2:
                        if samples[i, 0] < ieee_tb2[0, 0] and samples[i, 5] < ieee_tb2[0, 1] and samples[i, 7] < ieee_tb2[0, 2] and samples[i, 6] < ieee_tb2[0, 3] and samples[i, 8] < ieee_tb2[0, 4] and samples[i, 3] < ieee_tb2[0, 5] and samples[i, 4] < ieee_tb2[0, 6]:
                            sts_tb2[i]=1
                        else:
                            sts_tb2[i]=0
                    elif tfr_o2n2[i] > 0.2:
                        if samples[i, 0] < ieee_tb2[4, 0] and samples[i, 5] < ieee_tb2[4, 1] and samples[i, 7] < ieee_tb2[4, 2] and samples[i, 6] < ieee_tb2[4, 3] and samples[i, 8] < ieee_tb2[4, 4] and samples[i, 3] < ieee_tb2[4, 5] and samples[i, 4] < ieee_tb2[4, 6]:
                            sts_tb2[i]=1
                        else:
                            sts_tb2[i]=0

            elif tfr_age < 10:
                for i in range(nptr):
                    if tfr_o2n2[i] <= 0.2:
                        if samples[i, 0] < ieee_tb2[1, 0] and samples[i, 5] < ieee_tb2[1, 1] and samples[i, 7] < ieee_tb2[1, 2] and samples[i, 6] < ieee_tb2[1, 3] and samples[i, 8] < ieee_tb2[1, 4] and samples[i, 3] < ieee_tb2[1, 5] and samples[i, 4] < ieee_tb2[1, 6]:
                            sts_tb2[i]=1
                        else:
                            sts_tb2[i]=0
                    elif tfr_o2n2[i] > 0.2:
                        if samples[i, 0] < ieee_tb2[5, 0] and samples[i, 5] < ieee_tb2[5, 1] and samples[i, 7] < ieee_tb2[5, 2] and samples[i, 6] < ieee_tb2[5, 3] and samples[i, 8] < ieee_tb2[5, 4] and samples[i, 3] < ieee_tb2[5, 5] and samples[i, 4] < ieee_tb2[5, 6]:
                            sts_tb2[i]=1
                        else:
                            sts_tb2[i]=0

            elif tfr_age >= 10 and tfr_age < 30:
                for i in range(nptr):
                    if tfr_o2n2[i] <= 0.2:
                        if samples[i, 0] < ieee_tb2[2, 0] and samples[i, 5] < ieee_tb2[2, 1] and samples[i, 7] < ieee_tb2[2, 2] and samples[i, 6] < ieee_tb2[2, 3] and samples[i, 8] < ieee_tb2[2, 4] and samples[i, 3] < ieee_tb2[2, 5] and samples[i, 4] < ieee_tb2[2, 6]:
                            sts_tb2[i]=1
                        else:
                            sts_tb2[i]=0
                    elif tfr_o2n2[i] > 0.2:
                        if samples[i, 0] < ieee_tb2[6, 0] and samples[i, 5] < ieee_tb2[6, 1] and samples[i, 7] < ieee_tb2[6, 2] and samples[i, 6] < ieee_tb2[6, 3] and samples[i, 8] < ieee_tb2[6, 4] and samples[i, 3] < ieee_tb2[6, 5] and samples[i, 4] < ieee_tb2[6, 6]:
                            sts_tb2[i]=1
                        else:
                            sts_tb2[i]=0

            elif tfr_age >= 30:
                for i in range(nptr):
                    if tfr_o2n2[i] <= 0.2:
                        if samples[i, 0] < ieee_tb2[3, 0] and samples[i, 5] < ieee_tb2[3, 1] and samples[i, 7] < ieee_tb2[3, 2] and samples[i, 6] < ieee_tb2[3, 3] and samples[i, 8] < ieee_tb2[3, 4] and samples[i, 3] < ieee_tb2[3, 5] and samples[i, 4] < ieee_tb2[3, 6]:
                            sts_tb2[i]=1
                        else:
                            sts_tb2[i]=0
                    elif tfr_o2n2[i] > 0.2:
                        if samples[i, 0] < ieee_tb2[7, 0] and samples[i, 5] < ieee_tb2[7, 1] and samples[i, 7] < ieee_tb2[7, 2] and samples[i, 6] < ieee_tb2[7, 3] and samples[i, 8] < ieee_tb2[7, 4] and samples[i, 3] < ieee_tb2[7, 5] and samples[i, 4] < ieee_tb2[7, 6]:
                            sts_tb2[i]=1
                        else:
                            sts_tb2[i]=0
            #***********************************************************  IEEE TABLE 3 ********************************************************************

            for i in range (nptr):
                if tfr_o2n2[i]<=0.2:
                    if dev_samples[i, 0]<ieee_tb3[0,0] and dev_samples[i, 5]<ieee_tb3[0,1] and dev_samples[i, 7]<ieee_tb3[0,2] and dev_samples[i, 6]<ieee_tb3[0,3] and dev_samples[i, 8]<=ieee_tb3[0,4] and dev_samples[i, 3]<ieee_tb3[0,5] and dev_samples[i, 4]<ieee_tb3[0,6]:
                        sts_tb3[i]=1
                    else :
                        sts_tb3[i]=0  
                elif tfr_o2n2[i]>0.2:
                    if dev_samples[i, 0]<ieee_tb3[1,0] and dev_samples[i, 5]<ieee_tb3[1,1] and dev_samples[i, 7]<ieee_tb3[1,2] and dev_samples[i, 6]<ieee_tb3[1,3] and dev_samples[i, 8]<=ieee_tb3[1,4] and dev_samples[i, 3]<ieee_tb3[1,5] and dev_samples[i, 4]<ieee_tb3[1,6]:
                        sts_tb3[i]=1                       
                    else :
                        sts_tb3[i]=0

            #***********************************************************  IEEE TABLE 4 ********************************************************************
            pdctas_2=pdctas[4]
            pdctas_initial_list=pdctas
            pdctas = np.array(pdctas_initial_list, dtype=object)
            pdctas[pdctas == 'NA'] = np.nan
            pdctas = pdctas.astype(float)
            
            if tfr_age <=25:
                for i in range(nptr):
                    if durat[i]<300 :
                        if tfr_o2n2[i] <= 0.2:
                            if pdctas[0][i] < ieee_tb4[0, 0] and pdctas[5][i] < ieee_tb4[0, 1] and pdctas[7][i] < ieee_tb4[0, 2] and pdctas[6][i] < ieee_tb4[0, 3] and pdctas[8][i] < ieee_tb4[0, 4] and pdctas[3][i] < ieee_tb4[0, 5] and pdctas[4][i] < ieee_tb4[0, 6]:
                                sts_tb4[i]=1
                            else:
                                sts_tb4[i]=0
                        elif tfr_o2n2[i] > 0.2:
                            if pdctas[0][i] < ieee_tb4[2, 0] and pdctas[5][i] < ieee_tb4[2, 1] and pdctas[7][i] < ieee_tb4[2, 2] and pdctas[6][i] < ieee_tb4[2, 3] and pdctas[8][i] < ieee_tb2[2, 4] and pdctas[3][i] < ieee_tb4[2, 5] and pdctas[4][i] < ieee_tb4[2, 6]:
                                sts_tb4[i]=1
                            else:
                                sts_tb4[i]=0
                    elif durat[i]>= 300:
                        if tfr_o2n2[i] <= 0.2:
                            if pdctas[0][i] < ieee_tb4[1, 0] and pdctas[5][i] < ieee_tb4[1, 1] and pdctas[7][i] < ieee_tb4[1, 2] and pdctas[6][i] < ieee_tb4[1, 3] and pdctas[8][i] < ieee_tb4[1, 4] and pdctas[3][i] < ieee_tb4[1, 5] and pdctas[4][i] < ieee_tb4[1, 6]:
                                sts_tb4[i]=1
                            else:
                                sts_tb4[i]=0
                        elif tfr_o2n2[i] > 0.2:
                            if pdctas[0][i] < ieee_tb4[3, 0] and pdctas[5][i] < ieee_tb4[3, 1] and pdctas[7][i] < ieee_tb4[3, 2] and pdctas[6][i] < ieee_tb4[3, 3] and pdctas[8][i] < ieee_tb4[3, 4] and pdctas[3][i] < ieee_tb4[3, 5] and pdctas[4][i] < ieee_tb4[3, 6]:
                                sts_tb4[i]=1
                            else:
                                sts_tb4[i]=0

            tfr_status_ieee=np.zeros(nptr)
            for i in range (nptr):
                if nptr==1:
                    if sts_tb2[i]==0:
                        tfr_status_ieee[i]=3
                    else:
                        tfr_status_ieee[i]=2 
                else:
                    if pdctas_2[i]=="NA" :
                        if sts_tb3[i]==0:
                            tfr_status_ieee[i]=3
                        else:
                            tfr_status_ieee[i]=2
                    else:
                        if sts_tb1[i]==1 and sts_tb3[i]==1 and sts_tb4[i]==1:
                            tfr_status_ieee[i]=1
                        else:
                            if sts_tb2[i]==0 or sts_tb4[i]==0 :
                                tfr_status_ieee[i]=3
                            else:
                                tfr_status_ieee[i]=2
            return(tfr_status_ieee,sts_tb1,sts_tb2,sts_tb3,sts_tb4,pdctas,pdctas_2,nptr,mlplpy)