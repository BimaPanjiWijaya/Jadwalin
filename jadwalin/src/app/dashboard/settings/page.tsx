"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type Business = {
  id: string;
  name: string;
  category: string;
  description: string | null;
  address: string | null;
  phone: string | null;
  waNumber: string | null;
};
