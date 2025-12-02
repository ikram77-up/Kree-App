import Reservation from "../models/reservation.js";
import User from "../models/user.js";
import Client from "../models/client.js";
import Agency from "../models/agency.js";

// export const createreservation = async (req, res) => {
//   try {
//     // aucun user a connecte 
//     if (!req.user) return res.status(401).json({ message: "Unauthorized" });
//     const { startDate, endDate, carId, totalPrice, pickupLocation, returnLocation } = req.body;
//     if (req.user.role === "agency") {
//       return res.status(403).json({ message: "agency cannot create a reservation" });
//     }
//     // const targetUserID = req.user.role === "admin" ? req.body.userId : req.user._id;
//     const targetUserID = req.user._id;
//     const reservation = new Reservation({
//       startDate,
//       endDate,
//       carId,
//       totalPrice,
//       pickupLocation,
//       returnLocation,
//       status: "pending",
//       paymentStatus: "pending",
//       userId: targetUserID
//     });
//     await reservation.save();
//     await reservation.populate("userId", "name role");
//     await reservation.populate({
//       path: "carId",
//       select: "modelCar brand color image km fuelType gearBox seats features",
//       populate: {
//         path: "userId",
//         select: "name role"
//       }
//     });
//     res.status(201).json({ message: "Reservation created successfully", reservation });


//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

export const getAllreservations = async (req, res) => {
  try {
    const reservations = await Reservation.find()
      .populate("userId", "name role")
      .populate({
        path: "carId",
        select: "modelCar brand color image km fuelType gearBox seats features",
        populate: { path: "userId", select: "name role" },
      });
    const reservationsWithProfiles = [];
    for (const reservation of reservations) {
      const reservationObj = reservation.toObject();
      if (reservation.userId?.role === "client") {
        const clientProfile = await Client.findOne({ user: reservation.userId._id });
        reservationObj.clientProfile = clientProfile;
      }
      if (reservation.carId?.userId?.role === "agency") {
        const agencyProfile = await Agency.findOne({ user: reservation.carId.userId._id });
        reservationObj.agencyProfile = agencyProfile;
      }
      reservationsWithProfiles.push(reservationObj);
    }
    res.status(200).json(reservationsWithProfiles);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getreservationsbyId = async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.id)
      .populate("userId", "name role")
      .populate({
        path: "carId",
        select: "modelCar brand color image km fuelType gearBox seats features",
        populate: { path: "userId", select: "name role" },
      });
    if (!reservation) return res.status(404).json({ message: "Reservation not found" });
    const reservationObj = reservation.toObject();
    if (reservation.userId?.role === "client") {
      const clientProfile = await Client.findOne({ user: reservation.userId._id });
      reservationObj.clientProfile = clientProfile;
    }
    if (reservation.carId?.userId?.role === "agency") {
      const agencyProfile = await Agency.findOne({ user: reservation.carId.userId._id });
      reservationObj.agencyProfile = agencyProfile;
    }
    res.status(200).json(reservationObj);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateStatus = async (req, res) => {
  try {
    if (!req.isAgency) {
      return res.status(403).json({ message: "Unauthorized" });
    }
    const reservation = await Reservation.findById(req.params.id);
    if (!reservation) return res.status(404).json({ message: "Reservation not found" });
    const validStatus = ["pending", "accepted", "refused"];
    if (!validStatus.includes(req.body.status)) return res.status(400).json({ message: "Invalid status" });
    reservation.status = req.body.status;
    await reservation.save();
    res.status(200).json({ message: "Reservation status updated successfully", reservation });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updatePayment = async (req, res) => {
  try {
    if (!req.isAgency) {
      return res.status(403).json({ message: "Unauthorized" });
    }
    const reservation = await Reservation.findById(req.params.id);
    if (!reservation) return res.status(404).json({ message: "Reservation not found" });
    const validpaymentStatus = ["pending", "paid", "refused"];
    if (!validpaymentStatus.includes(req.body.paymentStatus)) return res.status(400).json({ message: "Invalid payment status" });
    reservation.paymentStatus = req.body.paymentStatus;
    await reservation.save();
    res.status(200).json({ message: "Reservation payment status updated successfully", reservation });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateReservation = async (req, res) => {
  try {
    if (!req.isAgency) {
      return res.status(403).json({ message: "Unauthorized" });
    }
    const reservation = await Reservation.findById(req.params.id);
    if (!reservation) return res.status(404).json({ message: "Reservation not found" });
    Object.assign(reservation, req.body);
    await reservation.save();
    res.status(200).json({ message: "Reservation updated successfully", reservation });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteReservation = async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.id);
    if (!reservation) return res.status(404).json({ message: "Reservation not found" });
    if (!req.isAgency) {
      if (reservation.userId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: "Unauthorized" });
      }
    }
    await reservation.deleteOne();
    res.status(200).json({ message: "Reservation deleted successfully", reservation });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};