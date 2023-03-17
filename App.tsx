/**
 * Sample BLE React Native App
 */
var Buffer = require("buffer/").Buffer;
import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  SafeAreaView,
  StyleSheet,
  View,
  Text,
  StatusBar,
  NativeModules,
  NativeEventEmitter,
  Platform,
  PermissionsAndroid,
  FlatList,
  TouchableHighlight,
  Pressable,
} from "react-native";
const SERVICE_UUID = "00001801-0000-1000-8000-00805f9b34fb";
const HEART_RATE_CHARACTERISTIC = "0000fff6-0000-1000-8000-00805f9b34fb";
const CHARACTERISTIC_NOTIFY = "00005533-0000-1000-8000-00805f9b34fb";
import { Colors } from "react-native/Libraries/NewAppScreen";

import { BleManager } from "react-native-ble-plx";

const App = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [peripherals, setPeripherals] = useState([]);
  const [allDevices, setAllDevices] = useState([]);
  const [error, setError] = useState("");
  const manager = useRef(new BleManager());
  const [connnectedDevices, setConnnectedDevices] = useState([]);
  const [connected, setConnected] = useState(null);
  const [connectedService, setConnectedService] = useState(null);
  useEffect(() => {
    console.log("vfdsvfds");
    setConnected(null);
    const subscription = manager.current.onStateChange((state) => {
      console.log("statestatestatestate", state);

      if (state === "PoweredOn") {
        search();
      }
    }, true);
    return () => {
      subscription.remove();
      stopSearch();
    };
  }, []);
  const scanAndConnect = useCallback(() => {
    manager.current.startDeviceScan([], null, (error, device) => {
      if (error) {
        console.log("error", error);
        stopSearch(false);
        alert("Unable to connect go to setting and grant all permission");
        setError(error?.message);

        return;
      }
      console.log("device?.name", device.name);

      // do not allow other that are not in our list
      if (true) {
        console.log("device", device);

        if (true) {
          let deviceMAC = device?.id?.replace(/:/g, "");

          if (
            connnectedDevices.findIndex((d) => d?.name === device?.name) == -1
          ) {
            // get information of corresponding FDA device
            let fdaDeviceInfo = device;

            device.image = fdaDeviceInfo?.image;

            let _connnectedDevices = [...connnectedDevices];
            _connnectedDevices.push(device);
            setConnnectedDevices(_connnectedDevices);
            // removeConntectedDeviceFromAllDeviceList();

            device.onDisconnected((connectionError, disconnectedDevice) => {
              onDeviceDisconnect(connectionError, disconnectedDevice);
            });
            stopSearch();
          }
        }
      }
    });
  }, [connnectedDevices]);

  useEffect(() => {
    if (isScanning) {
      setTimeout(() => {
        // stopSearch();
      }, 5000);
    }
  }, [isScanning]);
  const search = () => {
    setIsScanning(true);
    scanAndConnect();
  };
  const stopSearch = () => {
    setIsScanning(false);
    manager.current.stopDeviceScan();
  };

  const removeConntectedDeviceFromAllDeviceList = () => {
    let connnectedDeviceNames = connnectedDevices.map((connnectedItem) => {
      return connnectedItem.name;
    });
    let devicesNotConnected = allDevices.filter(
      (item) => !connnectedDeviceNames.includes(item.localName)
    );
  };
  const onDeviceDisconnect = (error, device) => {
    setConnected(null);
  };
  const hexToBase64 = (hexValue) => {
    return Buffer.from(hexValue, "hex").toString("base64");
  };
  const handleDiscoverPeripheral = (peripheral) => {};
  const decimalToHex = (d) => Number(d).toString(16).padStart(2, "0");

  const handShak = () => {
    var now = new Date();
    var year = now.getFullYear().toString().slice(-2);
    var month = now.getMonth() + 1;
    var day = now.getDate();
    var hour = now.getHours();
    var minute = now.getMinutes();
    var second = now.getSeconds();

    // as per doc Initial Byte Code 5AH(90)
    // Packet Length 0AH (10)
    // Packet Type 00H (00)
    // Check sum=total byte(1-9) + 2
    let checkSum =
      90 +
      10 +
      0 +
      Number(year) +
      Number(month) +
      Number(day) +
      Number(hour) +
      Number(minute) +
      Number(second) +
      2;

    let yearHex = decimalToHex(year);
    let monthHex = decimalToHex(month);
    let dayHex = decimalToHex(day);
    let hourHex = decimalToHex(hour);
    let minuteHex = decimalToHex(minute);
    let secondHex = decimalToHex(second);
    let checkSumHex = decimalToHex(checkSum);

    var packetPayload =
      "5A" +
      "0A" +
      "00" +
      yearHex +
      monthHex +
      dayHex +
      hourHex +
      minuteHex +
      secondHex +
      checkSumHex;
    console.log("packetPayload", packetPayload);

    let base64Value = hexToBase64(packetPayload);
    console.log("base64Value", base64Value);

    return base64Value;
  };
  const togglePeripheralConnection = async (_device) => {
    stopSearch();
    console.log("_device", _device);

    if (_device && _device.isConnected) {
      _device.isConnected().then((isDeviceConnected) => {
        setConnected(_device);
        if (true) {
          // let deviceVendorData = devicesVendorInfo[_device.name];
          let deviceVendorData = _device;
          console.log("deviceVendorData", deviceVendorData);

          _device
            .connect()
            .then((device) => {
              return device.discoverAllServicesAndCharacteristics();
            })
            .then((device) => {
              device.services().then((services) => {
                console.log("services", services);

                services.map((service) => {
                  service
                    .characteristics(services.uuid)
                    .then((characteristics) => {
                      characteristics.map((deviceVendorCharacteristics) => {
                        console.log(
                          deviceVendorCharacteristics &&
                            (deviceVendorCharacteristics.isNotifiable ||
                              deviceVendorCharacteristics.isIndicatable)
                        );
                        if (
                          deviceVendorCharacteristics.isWritableWithResponse
                        ) {
                          deviceVendorCharacteristics
                            .writeWithResponse(
                              handShak(),
                              deviceVendorCharacteristics.uuid
                            )
                            .then((writeCharacteristicsResponse) => {
                              console.log(
                                "writeCharacteristicsResponse",
                                writeCharacteristicsResponse
                              );
                            });
                        }
                        if (
                          deviceVendorCharacteristics &&
                          (deviceVendorCharacteristics.isNotifiable ||
                            deviceVendorCharacteristics.isIndicatable)
                        ) {
                          deviceVendorCharacteristics.monitor(
                            (error, characteristic1) => {
                              monitorCharacteristicForUUID(
                                error,
                                characteristic1,
                                _device.name
                              );
                            },
                            null
                          );
                        }
                      });

                      console.log("characteristics", characteristics);
                    });
                });
              });
            });
        }
      });
    } else {
      alert("Device Not Connected");
    }
  };
  const monitorCharacteristicForUUID = (error, characteristics, deviceName) => {
    console.log(error, characteristics, deviceName);
    setConnectedService(characteristics ? characteristics : error);
  };
  const geData = (deviceId) => {
    manager.current.monitorCharacteristicForDevice(
      deviceId,
      SERVICE_UUID,
      null,
      (error, characteristic) => {
        console.log("error", error);

        console.log("characteristic", characteristic);
      }
    );
  };
  const disconnectDevice = (id) => {
    manager.current.cancelDeviceConnection(id);
  };
  const retrieveConnected = async () => {};

  const connectPeripheral = async (peripheral) => {};

  function sleep(ms: number) {}

  useEffect(() => {
    handleAndroidPermissions();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAndroidPermissions = () => {
    if (Platform.OS === "android" && Platform.Version >= 31) {
      PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      ]).then((result) => {
        if (result) {
          console.debug(
            "[handleAndroidPermissions] User accepts runtime permissions android 12+"
          );
        } else {
          console.error(
            "[handleAndroidPermissions] User refuses runtime permissions android 12+"
          );
        }
      });
    } else if (Platform.OS === "android" && Platform.Version >= 23) {
      PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
      ).then((checkResult) => {
        if (checkResult) {
          console.debug(
            "[handleAndroidPermissions] runtime permission Android <12 already OK"
          );
        } else {
          PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
          ).then((requestResult) => {
            if (requestResult) {
              console.debug(
                "[handleAndroidPermissions] User accepts runtime permission android <12"
              );
            } else {
              alert("Unable to connect go to setting and grant all permission");

              console.error(
                "[handleAndroidPermissions] User refuses runtime permission android <12"
              );
            }
          });
        }
      });
    }
  };

  const renderItem = ({ item }: { item }) => {
    const backgroundColor = item.connected ? "#069400" : Colors.white;
    return (
      <TouchableHighlight
        underlayColor="#0082FC"
        onPress={() => togglePeripheralConnection(item)}
      >
        <View style={[styles.row, { backgroundColor }]}>
          <Text style={styles.peripheralName}>
            {/* completeLocalName (item.name) & shortAdvertisingName (advertising.localName) may not always be the same */}
            {item.name} - {item?.advertising?.localName}
            {item.connecting && " - Connecting..."}
          </Text>
          <Text style={styles.rssi}>RSSI: {item.rssi}</Text>
          <Text style={styles.peripheralId}>{item.id}</Text>
        </View>
      </TouchableHighlight>
    );
  };
  console.log("connnectedDevices", connected);

  return (
    <>
      <StatusBar />
      <SafeAreaView style={styles.body}>
        {connected == null ? (
          <>
            <Pressable style={styles.scanButton} onPress={search}>
              <Text style={styles.scanButtonText}>
                {isScanning ? "Scanning" : "Click to Scanning  Bluetooth"}
              </Text>
            </Pressable>
            <FlatList
              data={connnectedDevices}
              contentContainerStyle={{ rowGap: 12 }}
              renderItem={renderItem}
              keyExtractor={(item) => item.id}
            />
          </>
        ) : (
          <>
            <Text style={styles.scanButtonText}>{"Disconnect"}</Text>
            {renderItem({ item: connected })}
            <Text
              numberOfLines={8}
              ellipsizeMode="tail"
              style={{ paddingTop: 20 }}
            >
              {JSON.stringify(connectedService)}
            </Text>
          </>
        )}
      </SafeAreaView>
    </>
  );
};

const boxShadow = {
  shadowColor: "#000",
  shadowOffset: {
    width: 0,
    height: 2,
  },
  shadowOpacity: 0.25,
  shadowRadius: 3.84,
  elevation: 5,
};

const styles = StyleSheet.create({
  engine: {
    position: "absolute",
    right: 10,
    bottom: 0,
    color: Colors.black,
  },
  scanButton: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    backgroundColor: "#0a398a",
    margin: 10,
    borderRadius: 12,
    ...boxShadow,
  },
  scanButtonText: {
    fontSize: 20,
    letterSpacing: 0.25,
    color: Colors.white,
  },
  body: {
    backgroundColor: "#0082FC",
    flex: 1,
  },
  sectionContainer: {
    marginTop: 32,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: "600",
    color: Colors.black,
  },
  sectionDescription: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: "400",
    color: Colors.dark,
  },
  highlight: {
    fontWeight: "700",
  },
  footer: {
    color: Colors.dark,
    fontSize: 12,
    fontWeight: "600",
    padding: 4,
    paddingRight: 12,
    textAlign: "right",
  },
  peripheralName: {
    fontSize: 16,
    textAlign: "center",
    padding: 10,
  },
  rssi: {
    fontSize: 12,
    textAlign: "center",
    padding: 2,
  },
  peripheralId: {
    fontSize: 12,
    textAlign: "center",
    padding: 2,
    paddingBottom: 20,
  },
  row: {
    marginLeft: 10,
    marginRight: 10,
    borderRadius: 20,
    ...boxShadow,
  },
  noPeripherals: {
    margin: 10,
    textAlign: "center",
    color: Colors.white,
  },
});

export default App;
