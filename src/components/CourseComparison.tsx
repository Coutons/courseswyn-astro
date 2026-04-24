"use client";

import React from "react";



type Deal = {

  id: string;

  title: string;

  provider?: string;

  price?: number;

  originalPrice?: number;

  rating?: number;

  students?: number;

  duration?: string;

  url?: string;

  coupon?: string;

  expiresAt?: string;

  image?: string;

  category?: string;

  updatedAt?: string;

};



interface CourseComparisonProps {

  currentDeal: Deal;

  similarDeals: Deal[];

}



function formatPrice(price?: number): string {

  if (!price || price <= 0) return "$9.99";

  return `${price.toFixed(2)}`;

}



function formatRating(rating?: number): string {

  if (!rating || !isFinite(rating)) return "4.7";

  return rating.toFixed(1);

}



function formatStudents(students?: number): string {

  if (!students || !isFinite(students)) return "12.3k";

  if (students >= 1000000) return `${(students / 1000000).toFixed(1).replace(/\.0$/, "")}M`;

  if (students >= 1000) return `${(students / 1000).toFixed(1).replace(/\.0$/, "")}k`;

  return students.toString();

}



function discountPct(price?: number, original?: number): number {

  if (!price || !original || original <= price) return 0;

  return Math.round(100 - (price / original) * 100);

}



function getProviderLogo(provider?: string): string | null {

  if (!provider) return null;

  const providerLower = provider.toLowerCase();

  if (providerLower.includes('udemy')) return '/brands/udemy.svg';

  if (providerLower.includes('coursera')) return '/brands/coursera.svg';

  return null;

}



export default function CourseComparison({ currentDeal, similarDeals }: CourseComparisonProps) {

  if (!similarDeals || similarDeals.length === 0) return null;



  const dealsToCompare = [currentDeal, ...similarDeals.slice(0, 3)]; // Current + 3 similar (4 total)



  return (

    <section

      style={{ marginTop: "6rem", marginBottom: "4rem", borderTop: "1px solid #1f2330", paddingTop: "3rem" }}

      itemScope

      itemType="https://schema.org/ItemList"

    >

      {/* Structured Data for SEO/AI */}

      <script

        type="application/ld+json"

        dangerouslySetInnerHTML={{

          __html: JSON.stringify({

            "@context": "https://schema.org",

            "@type": "ItemList",

            "name": "Similar Courses Comparison",

            "description": "Compare this course with similar educational options",

            "numberOfItems": dealsToCompare.length,

            "itemListElement": dealsToCompare.map((deal, index) => ({

              "@type": "ListItem",

              "position": index + 1,

              "item": {

                "@type": "Course",

                "name": deal.title,

                "provider": {

                  "@type": "Organization",

                  "name": deal.provider

                },

                "url": deal.url,

                "image": deal.image,

                "offers": deal.price ? {

                  "@type": "Offer",

                  "price": deal.price.toString(),

                  "priceCurrency": "USD"

                } : undefined,

                "aggregateRating": deal.rating ? {

                  "@type": "AggregateRating",

                  "ratingValue": deal.rating,

                  "ratingCount": Math.max(1, Math.round(deal.students ?? 1000))

                } : undefined

              }

            }))

          }, null, 0)

        }}

      />

      <h2 style={{

        fontSize: "1.5rem",

        fontWeight: 700,

        marginBottom: "1rem",

        color: "#fff"

      }}>

        Compare Similar Courses

      </h2>

      <p style={{

        fontSize: "0.95rem",

        color: "#cbd5e1",

        lineHeight: "1.6",

        marginBottom: "2rem"

      }}>

        This section allows you to compare the current course with similar options to help you make an informed decision by evaluating prices, ratings, and key features side by side.

      </p>



      {/* Compact Comparison Cards */}

      <div

        style={{

          display: "grid",

          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",

          gap: "1.25rem"

        }}

        itemProp="itemListElement"

      >

        {dealsToCompare.map((deal, index) => (

          <article

            key={deal.id}

            style={{

              background: "#0b0d12",

              borderRadius: "10px",

              border: deal.id === currentDeal.id ? "2px solid #FBBF24" : "1px solid #1f2330",

              overflow: "hidden",

              transition: "all 0.3s ease",

              position: "relative",

              boxShadow: deal.id === currentDeal.id ? "0 0 15px rgba(251, 191, 36, 0.15)" : "0 2px 4px -1px rgba(0, 0, 0, 0.2)"

            }}

            itemScope

            itemType="https://schema.org/Course"

            itemProp="item"

          >



            {/* Current Course Badge */}

            {deal.id === currentDeal.id && (

              <div style={{

                position: "absolute",

                top: "0.75rem",

                right: "0.75rem",

                background: "#3b82f6",

                color: "#0b0d12",

                padding: "0.2rem 0.6rem",

                borderRadius: "12px",

                fontSize: "0.7rem",

                fontWeight: 700,

                zIndex: 10,

                textTransform: "uppercase",

                letterSpacing: "0.025em"

              }}>

                Current

              </div>

            )}



            {/* Compact Header with Image and Title */}

            <div style={{ padding: "0.875rem" }}>

              <div style={{ display: "flex", gap: "0.625rem", alignItems: "flex-start" }}>

                {/* Course Image */}

                <div style={{

                  width: "60px",

                  height: "60px",

                  borderRadius: "8px",

                  background: `linear-gradient(135deg, #3b82f620 0%, #8b5cf610 100%)`,

                  display: "flex",

                  alignItems: "center",

                  justifyContent: "center",

                  flexShrink: 0,

                  position: "relative",

                  overflow: "hidden"

                }}>

                  {deal.image ? (

                    <img

                      src={deal.image}

                      alt={deal.title}

                      style={{

                        width: "100%",

                        height: "100%",

                        objectFit: "cover"

                      }}

                      loading="lazy"

                    />

                  ) : getProviderLogo(deal.provider) ? (

                    <img

                      src={getProviderLogo(deal.provider)!}

                      alt={deal.provider}

                      style={{

                        width: "36px",

                        height: "36px",

                        objectFit: "contain"

                      }}

                      loading="lazy"

                    />

                  ) : (

                    <div style={{

                      fontSize: "20px",

                      fontWeight: 700,

                      color: "#9ca3af"

                    }}>

                      {deal.provider?.charAt(0)?.toUpperCase() || "C"}

                    </div>

                  )}

                </div>



                {/* Title and Provider */}

                <div style={{ flex: 1, minWidth: 0 }}>

                  <h3 style={{

                    fontSize: "0.95rem",

                    fontWeight: 600,

                    color: "#fff",

                    marginBottom: "0.25rem",

                    lineHeight: 1.3,

                    display: "-webkit-box",

                    WebkitLineClamp: 2,

                    WebkitBoxOrient: "vertical",

                    overflow: "hidden"

                  }}

                  itemProp="name"

                  >

                    <a

                      href={`/coupon/${deal.id}`}

                      style={{

                        color: "inherit",

                        textDecoration: "none",

                        transition: "color 0.2s ease"

                      }}

                      onMouseEnter={(e) => (e.target as HTMLElement).style.color = "#3b82f6"}

                      onMouseLeave={(e) => (e.target as HTMLElement).style.color = "#fff"}

                    >

                      {deal.title}

                    </a>

                  </h3>

                  <div style={{

                    color: "#a9b0c0",

                    fontSize: "0.8rem"

                  }}

                  itemProp="provider"

                  itemScope

                  itemType="https://schema.org/Organization"

                  >

                    <span itemProp="name">{deal.provider}</span>

                  </div>

                </div>

              </div>

            </div>



            {/* Stats and Pricing */}

            <div style={{ padding: "0 0.875rem 0.875rem 0.875rem" }}>

              {/* Rating and Students */}

              <div style={{

                display: "flex",

                alignItems: "center",

                gap: "0.625rem",

                marginBottom: "0.625rem",

                fontSize: "0.8rem"

              }}>

                <div style={{

                  display: "flex",

                  alignItems: "center",

                  gap: "0.25rem"

                }}>

                  <svg width="14" height="14" viewBox="0 0 24 24" fill="#f59e0b">

                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>

                  </svg>

                  <span style={{ color: "#f59e0b", fontWeight: 600 }}>

                    {formatRating(deal.rating)}

                  </span>

                </div>

                <span style={{ color: "#a9b0c0" }}>

                  {formatStudents(deal.students)} students

                </span>

              </div>



              {/* Pricing */}

              <div style={{

                display: "flex",

                alignItems: "center",

                justifyContent: "space-between",

                marginBottom: "0.75rem"

              }}>

                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>

                  <span style={{

                    fontSize: "1.1rem",

                    fontWeight: 700,

                    color: deal.price === 0 ? "#10b981" : "#3b82f6"

                  }}>

                    {deal.price === 0 ? "FREE" : formatPrice(deal.price)}

                  </span>

                  {deal.originalPrice && deal.price && deal.originalPrice > deal.price && (

                    <>

                      <span style={{

                        textDecoration: "line-through",

                        color: "#a9b0c0",

                        fontSize: "0.85rem"

                      }}>

                        {formatPrice(deal.originalPrice)}

                      </span>

                      <span style={{

                        background: "#ef4444",

                        color: "#0b0d12",

                        padding: "0.2rem 0.4rem",

                        borderRadius: "4px",

                        fontSize: "0.7rem",

                        fontWeight: 700

                      }}>

                        -{discountPct(deal.price, deal.originalPrice)}%

                      </span>

                    </>

                  )}

                </div>

              </div>



              {/* Action Button */}

              <a

                href={`/coupon/${deal.id}`}

                style={{

                  display: "block",

                  width: "100%",

                  padding: "0.6rem",

                  background: deal.id === currentDeal.id ? "#374151" : "#3b82f6",

                  color: "#fff",

                  textDecoration: "none",

                  borderRadius: "6px",

                  textAlign: "center",

                  fontWeight: 600,

                  fontSize: "0.85rem",

                  transition: "all 0.2s ease",

                  border: "none",

                  cursor: "pointer"

                }}

                onMouseEnter={(e) => {

                  (e.target as HTMLElement).style.background = deal.id === currentDeal.id ? "#4b5563" : "#2563eb";

                }}

                onMouseLeave={(e) => {

                  (e.target as HTMLElement).style.background = deal.id === currentDeal.id ? "#374151" : "#3b82f6";

                }}

              >

                {deal.id === currentDeal.id ? "Current" : "Compare"}

              </a>

            </div>

          </article>

        ))}

      </div>

      <p style={{

        fontSize: "0.95rem",

        color: "#cbd5e1",

        lineHeight: "1.6",

        marginBottom: "2rem"

      }}>

        Compare prices and features to find the best deal for your learning needs

      </p>

    </section>

  );

}