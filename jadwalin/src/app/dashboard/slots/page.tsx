"use client";

import React, { useState, useEffect } from "react";

type Slot = {
  id: string;
  startTime: string;
  endTime: string;
  status: string;
  service: { id: string; name: string };
  _count: { bookings: number };
  maxCapacity: number;
};

type Business = {
  id: string;
  name: string;
  service: { id: string; name: string }[];
};
