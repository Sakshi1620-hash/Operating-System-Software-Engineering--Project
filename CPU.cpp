#include <stdio.h>
void job (int *,int*,int,int);
int main()
{
    printf("\n Job Scheduling using Greedy\n");
    int profit[20],dead[20],n,i,j,maxdead;
    printf("\n Enter number of element/jobs:");
    scanf("%d",&n);
    printf("\n Enter profit in descending order:\n");
    for(i=0;i<n;i++)
    {
        scanf("%d",&profit[i]);
    }
        printf("\nEnter deadline according to profit value typed above :\n");
        for(i=0;i<n;i++)
        {
            scanf("%d",&dead[i]);
        }
         printf("\n Enter Maximum deadline:");
         scanf("%d",&maxdead);
         job(profit,dead,n,maxdead);
         return 0;
        }

        void job(int profit[],int dead[],int n,int maxdead)
        {
            int result[20],total=0,i,j;
            for(int i=0;i<maxdead;i++)
            {
                result[i]=0;
            }
            for(i=0;i<n;i++)
            {
                if(result[dead[i]-1]==0)
                {
                    result [dead[i]-1]=profit[i];
                    total=total+profit[i];
                }
                else
                {
                    for(int j=dead[i]-1;j>=0;j--)
                    {
                        if(result[j]==0)
                        {
                            result[j]=profit[i];
                            total=total+profit[i];
                        }
                    }
                }
            }
        printf("\n total profit is:%d",total);   
        printf("\n output array is \n");
            for (i=0;i<maxdead;i++)
            {
                printf("At index %d\t%d\n",i+1,result[i]);
            }
        }
