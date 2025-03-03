import React, { useCallback, useEffect, useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { UserDetails } from "../../../types/userType";
import WHSidebar from "../../../../components/WHSidebar";
import { getUserDetails } from "../../../utils/auth";
import { Menu } from "react-native-feather";


const WHScreen = React.memo(() => {
    const [isSidebarVisible, setSidebarVisible] = useState(false);
    const [user, setUser] = useState<UserDetails>();
    const [activeCategory, setActiveCategory] = useState(0);


    useEffect(() => {
        const fetchUserDetails = async () => {
            const user = await getUserDetails();
            setUser(user);
        };
        fetchUserDetails();
    }, []);

    const toggleSidebar = useCallback(() => {
        setSidebarVisible((prev) => !prev);
    }, []);

    const handleChangeCategory = useCallback((id: number) => {
        if (activeCategory !== id) {
            setActiveCategory(id);
        }
    }, [activeCategory]);

    return (
        <View style={{ flex: 1 }}>
            {user && (
                <WHSidebar isVisible={isSidebarVisible} toggleSidebar={toggleSidebar} userDetails={user} />
            )}
            <View className="top-3 flex bg-gray flex-row justify-between px-2 mb-6">
                <TouchableOpacity className="mt-1 ml-2" onPress={toggleSidebar}>
                    <Menu width={20} height={20} color="#fe6500" />
                </TouchableOpacity>
                <Text className="text-black text-lg font-bold">WAREHOUSE STOCKS</Text>
                <View className="items-center mr-2">
                    <View className="px-2 py-1 bg-[#fe6500] rounded-lg">
                        <Text className="text-white" style={{ fontSize: 12 }}>
                            {user?.name ? user.name.split(' ')[0].toUpperCase() : ''}
                        </Text>
                    </View>
                </View>
            </View>

            <View className="w-full justify-center items-center bg-gray relative">
                <View className="w-full flex-row justify-between px-24">
                    {['STOCKS', 'LOW STOCK ITEMS'].map((label, index) => (
                        <TouchableOpacity
                            key={index}
                            onPress={() => handleChangeCategory(index)}
                            className={`${activeCategory === index ? 'border-b-4 border-yellow-500' : ''} justify-center items-center`}
                        >
                            <View className="flex-row items-center space-x-1">
                                <Text
                                    className={`${activeCategory === index ? 'text-gray-900' : 'text-gray-500'} text-[10px] font-medium text-center`}
                                >
                                    {label}
                                </Text>
                            </View>
                        </TouchableOpacity>

                    ))}
                </View>
            </View>
        </View>
    );
});

export default WHScreen;
