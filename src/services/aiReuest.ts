
import { OnboardingData } from '@/components/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetch } from 'expo/fetch'
interface AiRequestResponse {
    jobId: string;
    message: string;
}

export const aiRequest = async (): Promise<AiRequestResponse> => {
    const garmentImage = await AsyncStorage.getItem('garmentImage');
    const onboardingData = await AsyncStorage.getItem('onboardingData');
    if (!onboardingData) {
        return { jobId: "error", message: "error" };
    }
    const onboardingDataObj = JSON.parse(onboardingData) as OnboardingData;
    if (!onboardingDataObj.fullBodyPhoto) {
        return { jobId: "error", message: "error" };
    }
    const body = {
        garmentImage: garmentImage,
        onboardingData:{
        ...onboardingDataObj
        }
    }
    const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/apple/openai`, {
        method: 'POST',
        body: JSON.stringify({ body }),
    });
    const result = await response.json();
    console.log(result)
    console.log(result.jobId)
    console.log(result.message)
    return { jobId: result.jobId, message: result.message };
}

export const aisuggest = async (jobId: string,index: number): Promise<AiRequestResponse> => {

    const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/apple/suggest`, {
        method: 'POST',
        body: JSON.stringify({ jobId:jobId, index: index }),
    });
    const result = await response.json();
    return { jobId: result.jobId, message: result.message };
}



export const aiRequestKling = async (jobId: string, index: number): Promise<string> => {
    const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/apple/kling`, {
        method: 'POST',
        body: JSON.stringify({ jobId:jobId, index: index }),
    });
    const result = await response.json();
    console.log(result.data)
    return result.data;
}