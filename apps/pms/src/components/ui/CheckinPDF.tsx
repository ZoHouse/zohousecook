/* eslint-disable jsx-a11y/alt-text */
/* eslint-disable @next/next/no-img-element */
import {
  Document,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import { GeneralObject } from "@zo/definitions/general";
import moment from "moment";
import React, { useMemo } from "react";
import { getAssetUrlByType, getGender } from "../../utils";

const styles = StyleSheet.create({
  page: {
    flexDirection: "column",
    backgroundColor: "#ffffff",
    padding: 20,
  },
  headerText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#121212",
    marginBottom: 20,
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    fontSize: 16,
    marginBottom: 10,
    fontWeight: "bold",
    color: "#5A5A5A",
    borderBottom: "1px solid #D1D5DB",
    paddingBottom: 5,
  },
  infoRow: {
    flexDirection: "row",
    marginBottom: 5,
  },
  infoLabel: {
    color: "#202020",
    fontSize: 12,
    width: "30%",
  },
  infoText: {
    color: "#5A5A5A",
    fontSize: 12,
    width: "70%",
  },
  subHeader: {
    fontSize: 14,
    fontWeight: "bold",
    marginTop: 10,
    marginBottom: 5,
    color: "#555",
  },
  image: {
    width: 600,
    height: 400,
    marginBottom: 10,
    objectFit: "contain",
  },
  imageContainer: {
    width: 600,
    marginVertical: 10,
  },
  logoContainer: {
    marginBottom: 10,
  },
  logo: {
    width: 50,
    height: 50,
  },
});

interface CheckinPDFProps {
  checkin: GeneralObject;
  stayInfo: GeneralObject;
  assets: GeneralObject[];
}

interface BookingRoomInfo {
  ref_id: string;
  inventory_name: string;
  asset_name: string;
}

const CheckinPDF: React.FC<CheckinPDFProps> = ({
  checkin,
  stayInfo,
  assets,
}) => {
  const bookingToShow = useMemo(() =>
    stayInfo && Object.keys(stayInfo).length
      ? stayInfo
      : checkin?.booking || {}, [stayInfo, checkin]);

  const aadhaarFront = useMemo(
    () => getAssetUrlByType(assets || [], 110),
    [assets]
  );
  const aadhaarBack = useMemo(
    () => getAssetUrlByType(assets || [], 111),
    [assets]
  );
  const passportMain = useMemo(
    () => getAssetUrlByType(assets || [], 112),
    [assets]
  );
  const passportAddress = useMemo(
    () => getAssetUrlByType(assets || [], 113),
    [assets]
  );
  const passportVisa = useMemo(
    () => getAssetUrlByType(assets || [], 114),
    [assets]
  );
  const aiFront = useMemo(() => getAssetUrlByType(assets || [], 116), [assets]);
  const aiBack = useMemo(() => getAssetUrlByType(assets || [], 117), [assets]);
  const idNumber = useMemo(
    () => assets.find((asset) => asset.type === 116)?.identifier || "",
    [assets]
  );

  const selectedIdDocument = useMemo(() => {
    if (aiFront && aiBack) {
      return "AI";
    } else if (aadhaarFront && aadhaarBack) {
      return "AADHAAR";
    } else if (passportMain && passportAddress && passportVisa) {
      return "PASSPORT";
    } else {
      return null;
    }
  }, [
    aiFront,
    aiBack,
    aadhaarFront,
    aadhaarBack,
    passportMain,
    passportAddress,
    passportVisa,
  ]);

  const frontIdDocument = useMemo(() => {
    if (selectedIdDocument === "AI") {
      return aiFront;
    } else if (selectedIdDocument === "AADHAAR") {
      return aadhaarFront;
    } else if (selectedIdDocument === "PASSPORT") {
      return passportMain;
    } else {
      return null;
    }
  }, [aiFront, aadhaarFront, passportMain, selectedIdDocument]);

  const backIdDocument = useMemo(() => {
    if (selectedIdDocument === "AI") {
      return aiBack;
    } else if (selectedIdDocument === "AADHAAR") {
      return aadhaarBack;
    } else if (selectedIdDocument === "PASSPORT") {
      return passportAddress;
    } else {
      return null;
    }
  }, [aiBack, aadhaarBack, passportAddress, selectedIdDocument]);

  const extraDocumemt = useMemo(() => {
    if (selectedIdDocument === "PASSPORT") {
      return passportVisa;
    } else {
      return null;
    }
  }, [passportVisa, selectedIdDocument]);

  const assignedRoomInfo = useMemo(() => {
    const mappedRoom = ((bookingToShow.rooms_info as BookingRoomInfo[]) || []).find(
      (roomInfo) => roomInfo.ref_id === checkin?.ref_id
    );

    return mappedRoom
      ? `${mappedRoom.inventory_name} - (${mappedRoom.asset_name})`
      : "Room & bed not assigned yet";
  }, [bookingToShow, checkin]);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.logoContainer}>
          <Image
            src="https://zoworld-static.s3.ap-south-1.amazonaws.com/media/zo-logo-black.png"
            style={styles.logo}
          />
        </View>
        <Text style={styles.headerText}>{bookingToShow?.operator?.name}</Text>

        {/* Personal Info Section */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Personal Information: </Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Name: </Text>
            <Text style={styles.infoText}>{checkin?.profile?.full_name}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Email: </Text>
            <Text style={styles.infoText}>{checkin?.profile?.email}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Phone: </Text>
            <Text style={styles.infoText}>{checkin?.profile?.mobile}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Gender: </Text>
            <Text style={styles.infoText}>
              {getGender(checkin?.profile?.gender)}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Address: </Text>
            <Text style={styles.infoText}>{checkin?.profile?.address}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Coming from: </Text>
            <Text style={styles.infoText}>{checkin?.coming_from}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Going to: </Text>
            <Text style={styles.infoText}>{checkin?.next_destination}</Text>
          </View>
        </View>

        {/* Booking Info Section */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Booking Information</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Booking Code: </Text>
            <Text style={styles.infoText}>{bookingToShow?.code}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Start Date: </Text>
            <Text style={styles.infoText}>
              {moment(bookingToShow?.start_date).format("DD MMM YYYY")}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>End Date: </Text>
            <Text style={styles.infoText}>
              {moment(bookingToShow?.end_date).format("DD MMM YYYY")}
            </Text>
          </View>
          {checkin.checkin_at && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Web Checkin: </Text>
              <Text style={styles.infoText}>
                {moment(checkin.checkin_at).format("LLL")}
              </Text>
            </View>
          )}
          {checkin.data?.property_checkin_at && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Property Checkin: </Text>
              <Text style={styles.infoText}>
                {moment(checkin.data?.property_checkin_at).format("LLL")}
              </Text>
            </View>
          )}
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Source: </Text>
            <Text style={styles.infoText}>
              {bookingToShow.source?.name || "N/A"}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Booked on: </Text>
            <Text style={styles.infoText}>
              {bookingToShow?.time_create
                ? moment(bookingToShow.time_create).format("D MMM YYYY, h:mm A")
                : "N/A"}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Assigned Room: </Text>
            <Text style={styles.infoText}>{assignedRoomInfo}</Text>
          </View>
        </View>

        {/* Documents Section */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Documents</Text>
          {idNumber && (
            <Text style={styles.subHeader}>ID Number: {idNumber}</Text>
          )}
          {frontIdDocument && (
            <>
              <Text style={styles.infoLabel}>Front:</Text>
              <View style={styles.imageContainer}>
                <Image
                  src={{
                    uri: frontIdDocument.concat("?format=jpg"),
                    method: "GET",
                    headers: {},
                    body: "",
                  }}
                  style={styles.image}
                />
              </View>
            </>
          )}
          {backIdDocument && (
            <>
              <Text style={styles.infoLabel}>Back:</Text>
              <View style={styles.imageContainer}>
                <Image
                  src={{
                    uri: backIdDocument.concat("?format=jpg"),
                    method: "GET",
                    headers: {},
                    body: "",
                  }}
                  style={styles.image}
                />
              </View>
            </>
          )}
          {extraDocumemt && (
            <>
              <Text style={styles.infoLabel}>Extra:</Text>
              <View style={styles.imageContainer}>
                <Image
                  src={{
                    uri: extraDocumemt.concat("?format=jpg"),
                    method: "GET",
                    headers: {},
                    body: "",
                  }}
                  style={styles.image}
                />
              </View>
            </>
          )}
        </View>
      </Page>
    </Document>
  );
};

export default CheckinPDF;
